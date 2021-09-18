const express = require("express");
// importando o uuid para gerar um id universal e úni
const { v4: uuidv4 } = require("uuid");

const app = express();
// usando o middleware para enviar dados no formato json
app.use(express.json());

// criando um banco de dados fake
const customers = [];

// middleware customizado para validar cpf
function verifyIfExistsAccountCPF(req, res, next) {
  // pega o cpf pelo header da rota
  const { cpf } = req.headers;
  // verifica se o cpf é válido
  const customer = customers.find((customer) => customer.cpf === cpf);

  // se não tiver cadastrado retorna uma mensagem 
  if(!customer) {
    return res.status(400).json({error: "Customer not found!"});
  }
  // inserindo informações dentro do request 
  req.customer = customer;

  return next();
}

// rota para criar uma conta
app.post("/account", (req, res) => {
  const { cpf, name } = req.body;
  // Verifica se o cpf que está sendo enviado já é cadastrado
  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );
  // se já existir o cpf, será enviada uma mensagem de erro
  if (customerAlreadyExists) {
    return res.status(400).json({error: "Customer already exists!"})
  }

  // adicionando dados no banco fake
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return res.status(201).send();
});

// app.use(verifyIfExistsAccountCPF); -> este middleware é indicado para quando for usar em mais de uma rota

// rota para pegar o extrato da conta do cliente
app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
  
  const { customer } = req;
  // retorna o extrato
  return res.json(customer.statement);
});

// rota para fazer um depósito na conta
app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
  // envia a descrição e o valor da operação pelo body
  const { description, amount } = req.body;
  // pega o usuário pela requisição
  const { customer } = req;
  // define o estado da operação
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };
  // faz a operação de envio
  customer.statement.push(statementOperation);
  // retorna o status da operação
  return res.status(201).send();
})

app.listen(3333, () => {
  console.log("Server is running on port 3333");
})