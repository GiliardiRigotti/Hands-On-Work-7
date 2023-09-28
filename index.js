const express = require('express');//npm install express
const mysql = require('mysql');//npm install mysql

const app = express();
app.listen(3000);//initialize web server

//initialize mysql connection
const MYSQL_IP = "localhost";
const MYSQL_LOGIN = "root";
const MYSQL_PASSWORD = "";

let con = mysql.createConnection({
  host: MYSQL_IP,
  user: MYSQL_LOGIN,
  password: MYSQL_PASSWORD,
  database: "imobiliaria"
});

con.connect(function (err) {
  if (err) {
    console.log(err);
    throw err;
  }
  console.log("Connection with mysql established");
});

function regraDeTres(fullValue, partialValue) {
  return Math.round((100 * partialValue) / fullValue)
}

function mesTotal(ano, array) {
  const filtrado = array.filter((item) => ano == new Date(item.data_do_pagamento).getFullYear())
  let resultado = []
  filtrado.map((item) => {
    const mes = new Date(item.data_do_pagamento).getMonth()
    const index = resultado.findIndex((itemTeste) => itemTeste.mes == mes)
    if (index >= 0) {
      resultado[index] = {
        mes,
        total: resultado[index].total + item.valor_do_pagamento
      }
    } else {
      resultado.push({
        mes,
        total: item.valor_do_pagamento
      })
    }
  })
  return resultado
}


app.get('/listar_imoveis_pagamento_total', function (req, res) {
  let sql = `SELECT id_venda,data_do_pagamento,valor_do_pagamento,imovel.codigo_imovel,imovel.descricao,tipo_imovel.tipo FROM pagamento
  JOIN imovel on imovel.codigo_imovel = pagamento.id_imovel
  JOIN tipo_imovel on imovel.id_tipo_imovel = tipo_imovel.id_tipo_imovel`;
  let imovelTotalPagamento = []
  con.query(sql, function (err, result) {
    if (err) {
      res.status(500);
      res.send(JSON.stringify(err));
    } else {
      result.map((item) => {
        const index = imovelTotalPagamento.findIndex((imovel) => item.codigo_imovel == imovel.codigo_imovel)
        if (index >= 0) {
          imovelTotalPagamento[index] = {
            codigo_imovel: imovelTotalPagamento[index].codigo_imovel,
            total: imovelTotalPagamento[index].total + item.valor_do_pagamento
          }
        } else {
          imovelTotalPagamento.push({
            codigo_imovel: item.codigo_imovel,
            total: item.valor_do_pagamento
          })
        }
      })
      const resultado = imovelTotalPagamento.map((item) => `[${item.codigo_imovel}] => ${item.total}`)
      res.status(200);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(resultado));
    }
  });
})

app.get('/listar_pagamento_total_mes_ano', function (req, res) {
  let sql = `SELECT id_venda,data_do_pagamento,valor_do_pagamento,imovel.codigo_imovel,imovel.descricao,tipo_imovel.tipo FROM pagamento
  JOIN imovel on imovel.codigo_imovel = pagamento.id_imovel
  JOIN tipo_imovel on imovel.id_tipo_imovel = tipo_imovel.id_tipo_imovel`;
  let imovelTotalPagamento = []
  con.query(sql, function (err, result) {
    if (err) {
      res.status(500);
      res.send(JSON.stringify(err));
    } else {
      result.map((item) => {
        const datePayment = new Date(item.data_do_pagamento)
        const index = imovelTotalPagamento.findIndex((imovel) => datePayment.getFullYear() == imovel.ano)
        if (index >= 0) {
          imovelTotalPagamento[index] = {
            ano: datePayment.getFullYear(),
            meses: mesTotal(datePayment.getFullYear(), result)
          }
        } else {
          imovelTotalPagamento.push({
            ano: datePayment.getFullYear(),
            meses: mesTotal(datePayment.getFullYear(), result)
          })
        }
      })
      let resultado = []
      imovelTotalPagamento.map((item) => resultado = item.meses.map((subItem) => `${subItem.mes}/${item.ano} => ${subItem.total}`))
      res.status(200);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(resultado));
    }
  });
})

app.get('/listar_pagamento_por_tipo_imovel', function (req, res) {
  let sql = `SELECT id_venda,data_do_pagamento,valor_do_pagamento,imovel.codigo_imovel,imovel.descricao,tipo_imovel.tipo FROM pagamento
  JOIN imovel on imovel.codigo_imovel = pagamento.id_imovel
  JOIN tipo_imovel on imovel.id_tipo_imovel = tipo_imovel.id_tipo_imovel`;
  let imovelTotalPagamento = []
  let totalPagamento = 0

  con.query(sql, function (err, result) {
    if (err) {
      res.status(500);
      res.send(JSON.stringify(err));
    } else {
      result.map((item) => {
        totalPagamento += item.valor_do_pagamento
        const index = imovelTotalPagamento.findIndex((imovel) => item.tipo == imovel.tipo_imovel)
        if (index >= 0) {
          imovelTotalPagamento[index] = {
            tipo_imovel: imovelTotalPagamento[index].tipo_imovel,
            total: imovelTotalPagamento[index].total + item.valor_do_pagamento,
          }
        } else {
          imovelTotalPagamento.push({
            tipo_imovel: item.tipo,
            total: item.valor_do_pagamento
          })
        }
      })

      const resultado = imovelTotalPagamento.map((item) => {
        return `${item.tipo_imovel} => ${regraDeTres(totalPagamento, item.total)}%`


      })
      res.status(200);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(resultado));
    }
  });
})

app.get('/get_gold_customers', function (req, res) {
  let sql = `SELECT customer_id, amount FROM sakila.payment`;
  con.query(sql, function (err, result) {
    if (err) {
      res.status(500);
      res.send(JSON.stringify(err));
    } else {
      let totalPerCustomer = new Map();

      result.forEach(record => {

        if (totalPerCustomer.get(record['customer_id']) === undefined) {
          totalPerCustomer.set(record['customer_id'], {
            value: record['amount'],
            customer: record['customer_id']
          });
        } else {
          totalPerCustomer.get(record['customer_id']).value += record['amount'];
        }
      });
      //console.log(totalPerCustomer);
      let arrayTotalPerCustomer = Array.from(totalPerCustomer.values());
      //console.log("arrayTotalPerCustomer",arrayTotalPerCustomer);
      const GOLD_VALUE = 100;
      let goldCustomers = arrayTotalPerCustomer.filter(el => el.value > GOLD_VALUE);
      //CORS
      res.status(200);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS,PUT,DELETE,HEAD");
      res.setHeader("Access-Control-Allow-Headers", "X-PINGOTHER,Origin,X-Requested-With,Content-Type,Accept");
      res.setHeader("Access-Control-Max-Age", "1728000");
      res.send(JSON.stringify(goldCustomers));
    }
  });
});


console.log("API - JUST GOLD CUSTOMERS IS RUNNING");