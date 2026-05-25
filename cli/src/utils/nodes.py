import dataclasses
import hashlib
import json
import click
import pickle

@dataclasses.dataclass
class Node:
    
    parent_hash:str
    commit_msg:str
    branch:str
    _hash:str = dataclasses.field(init=False)
    history: list = dataclasses.field(default_factory=list)
    
    def generate_hash(self):
        payload = {
            "history":self.history,
            "parent hash":self.parent_hash
        }

        s = json.dumps(payload,sort_keys=True)
        
        return hashlib.sha256(s.encode('utf-8')).hexdigest()


class NodeTree:
    def __init__(self):
        self.nodes = {}
        self.head = None
        self.cur_branch:str = 'main'
        self.branches:dict[str,str] = {}
        self.cur_history: list = []

        self.load()

    def commit(self,history,msg):
        try:
            new_node = Node(history=history,commit_msg=msg,parent_hash=self.head,branch=self.cur_branch)
            new_node._hash = new_node.generate_hash()
            self.nodes[new_node._hash] = new_node
            self.head = new_node._hash
            self.branches[new_node.branch] = new_node._hash
            self.save()
            return True
        
        except Exception as e:
            click.echo(click.style(e,fg='red'))

    def create_branch(self,name):
        try:
            self.branches[name] = self.head
            return True
        except Exception as e:
            click.echo(click.style(e,fg="red"))
            return False
    
    def checkout(self,branch): #unfinshed
        self.cur_branch = branch


    def get_history(self):
        for node in self.nodes:
            print(self.nodes[node].commit_msg,end="===>>> ")
        print("END")
    
    def clear_history(self):
        self.cur_history = []
        
    def go_to(self,hash_):
        self.cur_history = self.nodes[hash_].history

    def save(self):
        with open("data.dat","wb") as f:
            data = [self.nodes,self.branches]
            pickle.dump(data,f)
        
        self.load()
    def load(self):
        try:
            with open("data.dat","rb") as f:
                data = pickle.load(f)
                self.nodes = data[0]
                self.branches = data[1]

                node_hash = self.branches[self.cur_branch] #returns hash of head node of current branch
                self.cur_history = self.nodes[node_hash].history

        except Exception as e:
            click.echo(click.style(e,fg="red"))

        