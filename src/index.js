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

// Verifica o tipo de operação se é crédito ou débito
function getBalance(statement) {

  const balance = statement.reduce((acc, operation) => {
    // verifica o tipo de operação
    if(operation.type === "credit") {
      return acc = operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
};

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
});

// rota para saque
app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
  // recebendo a quantia para fazer o saque
  const { amount } = req.body;
  // pegando o customer dentro do request
  const { customer } = req;
  // pega o valor do saldo da conta
  const balance = getBalance(customer.statement);
  // verifica se tem saldo na conta
  if(balance < amount) {
    return res.status(400).json({ error: "Insufficient Funds!" });
  }
  // define o estado da operação
  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };
  // envia a operação para a conta
  customer.statement.push(statementOperation);

  return res.status(201).send();
});
// rota para atualizar o nome
app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
  // recebe o nome pelo body
  const { name } = req.body;
  // pegar o customer pela requisição
  const { customer } = req;
  // atualiza o nome
  customer.name = name;
  // retorna o status se ocorreu tudo certo
  return res.status(201).send();
});
// rota para mostrar os dados do cliente
app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
  // pega o customer do request
  const { customer } = req;
  // retorna o customer
  return res.json(customer);
})

// app.use(verifyIfExistsAccountCPF); -> este middleware é indicado para quando for usar em mais de uma rota

// rota para pegar o extrato da conta do cliente
app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
  
  const { customer } = req;
  // retorna o extrato
  return res.json(customer.statement);
});

// rota para consultar saldo por data
app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
  
  const { customer } = req;
  // pega a data pelo query params
  const { date } = req.query;
  // formatando a data para o padrão pt-bt
  const dateFormat = new Date(date + " 00:00");
  // encontra todos os saldos a partir da data informada
  const statement = customer.statement.filter(
    (statement) => 
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  )


  // retorna o extrato
  return res.json(statement);
});


app.listen(3333, () => {
  console.log("Server is running on port 3333");
})