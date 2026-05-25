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
    "agents": []
}

class MockTable:
    def __init__(self, table_name):
        self.table_name = table_name
        self._where_col = None
        self._where_val = None
        self._pending_data = None
        self._op = None

    def select(self, *args, **kwargs): 
        self._op = "select"
        return self
        
    def insert(self, data, **kwargs): 
        self._op = "insert"
        self._pending_data = data
        return self
        
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
        
    def execute(self):
        class MockResponse:
            data = []
            
        res = MockResponse()
        
        if self.table_name not in _MOCK_DATA:
            _MOCK_DATA[self.table_name] = []
            
        table_data = _MOCK_DATA[self.table_name]
            
        if self._op == "select":
            if self._where_col:
                res.data = [row for row in table_data if row.get(self._where_col) == self._where_val]
            else:
                res.data = table_data
                
        elif self._op == "insert":
            if isinstance(self._pending_data, list):
                table_data.extend(self._pending_data)
            else:
                table_data.append(self._pending_data)
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
                
        return res

class MockClient:
    def table(self, table_name):
        return MockTable(table_name)

if not SUPABASE_URL or not SUPABASE_KEY:
    # Dummy mock client for when env is not set
    supabase = MockClient()
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_db():
    return supabase
