import zlib
import json
import base64
from typing import Any, Dict

def compress_payload(payload: Dict[str, Any]) -> str:
    """Compresses a JSON payload using zlib and encodes it as base64."""
    serialized = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
    compressed = zlib.compress(serialized)
    return base64.b64encode(compressed).decode('utf-8')

def decompress_payload(compressed_b64: str) -> Dict[str, Any]:
    """Decompresses a base64 encoded zlib-compressed JSON payload."""
    compressed = base64.b64decode(compressed_b64.encode('utf-8'))
    decompressed = zlib.decompress(compressed)
    return json.loads(decompressed.decode('utf-8'))
