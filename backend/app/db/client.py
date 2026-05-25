import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Global memory store for mock db
_MOCK_DATA = {
    "commits": [],
    "branches": [],
    "agents": [],
    "cli_commands": []  # added table for CLI history
}

class MockTable:
    def __init__(self, table_name):
        self.table_name = table_name
        self._where_col = None
        self._where_val = None
        self._pending_data = None
        self._op = None
        self._order_column = None
        self._order_desc = False
        self._limit = None

    def select(self, *args, **kwargs): 
        self._op = "select"
        return self
        
    def insert(self, data, **kwargs): 
        self._op = "insert"
        self._pending_data = data
        # Ensure table exists
        if self.table_name not in _MOCK_DATA:
            _MOCK_DATA[self.table_name] = []
        table_data = _MOCK_DATA[self.table_name]
        if isinstance(data, list):
            table_data.extend(data)
        else:
            table_data.append(data)
        # Return a dict with a fake id (auto‑increment like behavior)
        return {"id": len(table_data)}
        
    def update(self, data, **kwargs): 
        self._op = "update"
        self._pending_data = data
        return self
        
    def delete(self, *args, **kwargs): 
        self._op = "delete"
        return self
        
    def eq(self, col, val): 
        self._where_col = col
        self._where_val = val
        return self
        
    def order(self, column, desc=False):
        self._order_column = column
        self._order_desc = desc
        return self

    def limit(self, count):
        self._limit = count
        return self

    def execute(self):
        class MockResponse:
            data = []
            
        res = MockResponse()
        
        if self.table_name not in _MOCK_DATA:
            _MOCK_DATA[self.table_name] = []
            
        table_data = _MOCK_DATA[self.table_name]
            
        if self._op == "select":
            rows = table_data
            if self._where_col:
                rows = [row for row in rows if row.get(self._where_col) == self._where_val]
            if self._order_column:
                rows = sorted(rows, key=lambda r: r.get(self._order_column), reverse=self._order_desc)
            if self._limit is not None:
                rows = rows[:self._limit]
            res.data = rows
                
        elif self._op == "insert":
            # insert already handled in insert method; just return the inserted data
            res.data = self._pending_data
            
        elif self._op == "update":
            if self._where_col:
                for row in table_data:
                    if row.get(self._where_col) == self._where_val:
                        row.update(self._pending_data)
            res.data = self._pending_data
            
        elif self._op == "delete":
            if self._where_col:
                _MOCK_DATA[self.table_name] = [row for row in table_data if row.get(self._where_col) != self._where_val]
            else:
                _MOCK_DATA[self.table_name] = []
            res.data = []
                
        return res

class MockClient:
    def table(self, table_name):
        return MockTable(table_name)
    # Supabase uses `from_` as the table accessor; provide an alias
    def from_(self, table_name):
        return self.table(table_name)

if not SUPABASE_URL or not SUPABASE_KEY:
    # Dummy mock client for when env is not set
    supabase = MockClient()
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_db():
    return supabase
