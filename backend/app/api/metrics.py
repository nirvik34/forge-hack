from fastapi import APIRouter
from app.db.client import get_db
from datetime import datetime, timedelta
from collections import defaultdict
import structlog

router = APIRouter()
logger = structlog.get_logger()


def _safe_query(db, table_name, filters=None):
    """Safely query a table, returning empty list on failure."""
    try:
        query = db.table(table_name).select("*")
        if filters:
            for col, val in filters.items():
                query = query.eq(col, val)
        res = query.execute()
        return res.data if res.data else []
    except Exception as e:
        logger.warning("analytics_query_failed", table=table_name, error=str(e))
        return []


@router.get("/")
def get_metrics():
    """
    Lightweight metrics for the Dashboard sidebar.
    Queries real DB state when available.
    """
    db = get_db()

    commits = _safe_query(db, "commits")
    agents = _safe_query(db, "agents")
    watchdog_logs = _safe_query(db, "watchdog_logs")

    total_commits = len(commits)
    rollback_count = sum(1 for c in commits if c.get("status") == "flagged")
    active_agents = len([a for a in agents if a.get("status") == "Active"]) if agents else 0
    tokens_used = sum(c.get("tokens_used", 0) for c in commits)

    integrity = round(
        ((total_commits - rollback_count) / total_commits * 100) if total_commits > 0 else 99.9,
        1
    )

    return {
        "status": "success",
        "data": {
            "memory_integrity": integrity,
            "active_agents": active_agents,
            "rollbacks": rollback_count,
            "api_tokens_used": tokens_used,
            "api_tokens_total": 5000000,
        }
    }


@router.get("/analytics")
def get_analytics():
    """
    Comprehensive analytics endpoint for the Analytics page.
    Aggregates commits, branches, watchdog_logs, and agents tables
    into KPIs, time-series, and leaderboard data.

    All data is computed from real DB state — when the DB is empty
    (e.g. fresh install / mock mode), we return zeroed-out structures
    so the frontend gracefully shows "no data yet" instead of crashing.
    """
    db = get_db()

    # ── Pull raw data from all relevant tables ──────────────────────
    commits = _safe_query(db, "commits")
    branches = _safe_query(db, "branches")
    watchdog_logs = _safe_query(db, "watchdog_logs")
    agents = _safe_query(db, "agents")

    now = datetime.utcnow()

    # ── 1. KPI Cards ────────────────────────────────────────────────
    total_commits = len(commits)
    flagged_count = sum(1 for c in commits if c.get("status") == "flagged")
    verified_count = sum(1 for c in commits if c.get("status") == "verified")
    error_count = sum(1 for c in commits if c.get("status") == "error")
    pending_count = sum(1 for c in commits if c.get("status") == "pending")
    active_branches = len(branches)
    total_tokens = sum(c.get("tokens_used", 0) for c in commits)

    # Classify commits by environment (cloud vs local) using agent metadata
    agent_map = {a.get("id"): a for a in agents}
    local_commits = 0
    cloud_commits = 0
    for c in commits:
        agent = agent_map.get(c.get("agent_id") or c.get("branch_id"))
        agent_type = (agent.get("type", "") if agent else "").lower()
        if "local" in agent_type or "ide" in agent_type or "cli" in agent_type:
            local_commits += 1
        else:
            cloud_commits += 1

    kpis = {
        "total_commits": total_commits,
        "local_commits": local_commits,
        "cloud_commits": cloud_commits,
        "watchdog_interventions": flagged_count,
        "active_branches": active_branches,
        "total_tokens": total_tokens,
        "verified_count": verified_count,
        "error_count": error_count,
        "pending_count": pending_count,
    }

    # ── 2. Activity Timeline (last 7 days) ──────────────────────────
    # Build day labels and bucket commits by created_at date
    day_labels = []
    cloud_series = []
    local_series = []
    token_series = []

    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%b %d")
        day_labels.append(day_str)

        day_cloud = 0
        day_local = 0
        day_tokens = 0

        for c in commits:
            created = c.get("created_at")
            if not created:
                continue
            try:
                if isinstance(created, str):
                    # Handle ISO format from Supabase
                    commit_date = datetime.fromisoformat(created.replace("Z", "+00:00")).date()
                else:
                    commit_date = created.date() if hasattr(created, "date") else None

                if commit_date and commit_date == day.date():
                    agent = agent_map.get(c.get("agent_id") or c.get("branch_id"))
                    agent_type = (agent.get("type", "") if agent else "").lower()
                    if "local" in agent_type or "ide" in agent_type or "cli" in agent_type:
                        day_local += 1
                    else:
                        day_cloud += 1
                    day_tokens += c.get("tokens_used", 0)
            except (ValueError, TypeError):
                continue

        cloud_series.append(day_cloud)
        local_series.append(day_local)
        token_series.append(round(day_tokens / 1_000_000, 2) if day_tokens else 0)

    activity_timeline = {
        "labels": day_labels,
        "cloud_commits": cloud_series,
        "local_commits": local_series,
    }

    token_timeline = {
        "labels": day_labels,
        "tokens_millions": token_series,
    }

    # ── 3. Watchdog Interventions by Agent ──────────────────────────
    watchdog_by_agent = defaultdict(int)
    for log in watchdog_logs:
        commit_hash = log.get("commit_hash", "")
        # Find which agent owns this commit
        matching_commit = next((c for c in commits if c.get("hash") == commit_hash), None)
        if matching_commit:
            agent_id = matching_commit.get("agent_id") or matching_commit.get("branch_id", "unknown")
            agent_info = agent_map.get(agent_id)
            agent_name = agent_info.get("name", agent_id) if agent_info else agent_id
        else:
            agent_name = "unknown"
        if log.get("verdict") == "FAIL":
            watchdog_by_agent[agent_name] += 1

    # Also count flagged commits without explicit watchdog_logs
    for c in commits:
        if c.get("status") == "flagged":
            agent_id = c.get("agent_id") or c.get("branch_id", "unknown")
            agent_info = agent_map.get(agent_id)
            agent_name = agent_info.get("name", agent_id) if agent_info else agent_id
            # Only add if not already counted via watchdog_logs
            if agent_name not in watchdog_by_agent:
                watchdog_by_agent[agent_name] = 0
            watchdog_by_agent[agent_name] += 1

    watchdog_chart = {
        "labels": list(watchdog_by_agent.keys()),
        "counts": list(watchdog_by_agent.values()),
    }

    # ── 4. Memory / Storage Distribution ───────────────────────────
    s3_count = sum(1 for c in commits if c.get("payload_s3_uri"))
    db_count = sum(1 for c in commits if c.get("compressed_payload") and not c.get("payload_s3_uri"))
    inmem_count = total_commits - s3_count - db_count

    total_storage = max(s3_count + db_count + inmem_count, 1)  # avoid div/0
    storage_distribution = {
        "labels": ["Object Store (S3)", "Database (Supabase)", "In-Memory / Pending"],
        "values": [
            round(s3_count / total_storage * 100),
            round(db_count / total_storage * 100),
            round(inmem_count / total_storage * 100),
        ],
    }

    # ── 5. Agent Leaderboard ────────────────────────────────────────
    agent_stats = defaultdict(lambda: {
        "total_commits": 0,
        "rollbacks": 0,
        "tokens_used": 0,
        "environment": "Unknown",
        "name": "unknown",
    })

    for c in commits:
        agent_id = c.get("agent_id") or c.get("branch_id", "unknown")
        agent_info = agent_map.get(agent_id)
        name = agent_info.get("name", agent_id) if agent_info else agent_id
        env_type = agent_info.get("type", "Cloud Agent") if agent_info else "Cloud Agent"

        stats = agent_stats[agent_id]
        stats["name"] = name
        stats["environment"] = env_type
        stats["total_commits"] += 1
        stats["tokens_used"] += c.get("tokens_used", 0)
        if c.get("status") == "flagged":
            stats["rollbacks"] += 1

    leaderboard = []
    for agent_id, stats in agent_stats.items():
        tc = stats["total_commits"]
        rb = stats["rollbacks"]
        health = round(((tc - rb) / tc * 100) if tc > 0 else 100, 1)
        leaderboard.append({
            "id": agent_id,
            "name": stats["name"],
            "environment": stats["environment"],
            "total_commits": tc,
            "rollbacks": rb,
            "health_score": health,
            "tokens_used": stats["tokens_used"],
        })

    # Sort by total commits descending
    leaderboard.sort(key=lambda x: x["total_commits"], reverse=True)

    # ── 6. Metadata ────────────────────────────────────────────────
    meta = {
        "generated_at": now.isoformat() + "Z",
        "period_start": (now - timedelta(days=6)).strftime("%b %d, %Y"),
        "period_end": now.strftime("%b %d, %Y"),
    }

    logger.info("analytics_generated", total_commits=total_commits, agents=len(agents))

    return {
        "status": "success",
        "data": {
            "kpis": kpis,
            "activity_timeline": activity_timeline,
            "token_timeline": token_timeline,
            "watchdog_chart": watchdog_chart,
            "storage_distribution": storage_distribution,
            "leaderboard": leaderboard,
            "meta": meta,
        }
    }
