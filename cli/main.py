#Custom Modules
from src.chatbot.chatbot import Chatbot
from src.utils.nodes import NodeTree
from src.utils.memory import Memory

import click
import questionary
import asyncio

class Main:

    def __init__(self):
        self.keywords = ["r","-goto","-commit","-history","-branch","-checkout","-exit"]
        self.nodeTree = NodeTree()
        self.chatMemory = Memory()
        self.chatbot = Chatbot()

        self.chatMemory.history = self.nodeTree.cur_history
        print(self.chatMemory.history)
    def pre_loop(self):
        #LLM Selection

        llm_model = questionary.select("Select model",
                                         choices=["qwen2.5:3b","gpt-oss:20b"]).ask()
        
        click.echo(f"You chose {llm_model}")

        self.chatbot.set_llm(llm_model)
        self.mainloop()
    
    def mainloop(self):
        #mainloop
        while True:
            q = click.prompt(f"({self.nodeTree.cur_branch}) User : ")
            if q not in self.keywords:
                self.chatMemory.history.append({"role":"user","content":q})
                res = self.chatbot.ask(self.chatMemory.history)
                if(res):

                    self.chatMemory.history.append({"role":"ai","content":res})

                    click.echo("AI : " + res)

                else:
                    click.echo("Error occurred")
            else:
                if q.lower() == self.keywords[0]:
                    self.clear_history()
                if q.lower() == self.keywords[1]:
                    self.goto_commit()
                elif q.lower() == self.keywords[2]:
                    self.commit_context()
                elif q.lower() == self.keywords[3]:
                    self.nodeTree.get_history()
                elif q.lower() == self.keywords[4]:
                    self.create_branch()
                elif q.lower() == self.keywords[5]:
                    self.checkout()
                elif q.lower() == self.keywords[-1]:
                    break
        click.echo("bye bye")
                

    def commit_context(self):
        msg = click.prompt("commit message : ")
        if (self.nodeTree.commit(self.chatMemory.history,msg)):
            click.echo(click.style("commit successful",fg="green"))
    
    def create_branch(self):
        branch_name = click.prompt("Branch Name : ")
        if(self.nodeTree.create_branch(branch_name)):
            click.echo(click.style("New branch created",fg="green"))

    def checkout(self):
        branch_name = click.prompt("Branch name : ")
        self.nodeTree.checkout(branch_name)
    
    def clear_history(self):
        self.nodeTree.clear_history()
        self.chatMemory.history = self.nodeTree.cur_history

    def goto_commit(self):
        commit_option = []
        for hash,node in self.nodeTree.nodes.items():
            if node.branch == self.nodeTree.cur_branch:
                commit_option.append(node.commit_msg + " " + hash)

        commit = questionary.select("Select model",
                                         choices=commit_option).ask()
        commit_hash = commit.split()[1]
        print(commit_hash)
        self.nodeTree.go_to(commit_hash)
        self.chatMemory.history = self.nodeTree.cur_history
        print(self.chatMemory.history)

if __name__ == "__main__":
    main = Main()
    main.pre_loop() #runs before main loop
    