from langchain_ollama import ChatOllama



class Chatbot:
    
    def __init__(self):
        self.llm = None

    def set_llm(self,llm_model):
        self.llm = ChatOllama(model=llm_model)
        
    def ask(self,query) -> str:
        res = self.llm.invoke(query)

        return res.content