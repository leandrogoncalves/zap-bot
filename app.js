const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 8002;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

app.use(fileUpload({
  debug: true
}));

app.get('/', (req, res) => {
  console.log('Rota Raiz: ');
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
  });
  
  client.initialize();
  
  io.on('connection', function(socket) {
    console.log('conectando......')
    socket.emit('message', 'Conectando...');
    
    client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit('qr', url);
        socket.emit('message', 'BOT-ZDG QRCode recebido, aponte a câmera  seu celular!');
      });
    });
    
    client.on('ready', () => {
      socket.emit('ready', 'BOT-ZDG Dispositivo pronto!');
      socket.emit('message', 'BOT-ZDG Dispositivo pronto!');	
      console.log('BOT-ZDG Dispositivo pronto');
    });
    
    client.on('authenticated', () => {
      socket.emit('authenticated', 'BOT-ZDG Autenticado!');
      socket.emit('message', 'BOT-ZDG Autenticado!');
      console.log('BOT-ZDG Autenticado');
    });
    
    client.on('auth_failure', function() {
      socket.emit('message', 'BOT-ZDG Falha na autenticação, reiniciando...');
      console.error('BOT-ZDG Falha na autenticação');
    });
    
    client.on('change_state', state => {
      console.log('BOT-ZDG Status de conexão: ', state );
    });
    
    client.on('disconnected', (reason) => {
      socket.emit('message', 'BOT-ZDG Cliente desconectado!');
      console.log('BOT-ZDG Cliente desconectado', reason);
      client.initialize();
    });
  });
  
  // Send message
  app.post('/send-message', [
    body('number').notEmpty(),
    body('message').notEmpty(),
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });
    
    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }
    
    const number = req.body.number + '@c.us';
    const message = req.body.message;
    
    console.log('numero: ' + number);
    console.log('message: ' + message);
    
    client.sendMessage(number, message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
  });
  
  client.on('message', async msg => {
    
    const nomeContato = msg._data.notifyName;
    console.log('nome: '+ nomeContato);
    console.log('type: '+ msg.type);
    console.log('body: '+ msg.body);
    
    if (msg.type.toLowerCase() == "e2e_notification") return null;
    
    if (msg.body == "") return null;

    if (msg.body === "1") {
      msg.reply(`
      ${nomeContato} seja bem-vindo(a) ao Salão de Beleza da Maria Chiquinha! Nós estamos muito animados em recebê-los em nosso espaço acolhedor e aconchegante, onde oferecemos uma ampla gama de serviços de beleza para ajudá-lo a ficar com a aparência e se sentir bem.
      
      Nosso salão é administrado por uma equipe de profissionais altamente capacitados e apaixonados pela indústria da beleza, que estão sempre atualizados com as últimas tendências e técnicas. Nós usamos apenas os melhores produtos e equipamentos disponíveis para garantir que você obtenha os melhores resultados possíveis em todos os serviços que oferecemos.
      
      Gostaria de agendar um horário com a gente?
      *2* Sim
      *6* Não
      `);
    }
    
    else if (msg.body === "2") {
      msg.reply(`Legal ${nomeContato}! O Salão de Beleza da Maria Chiquinha oferece uma ampla variedade de serviços de beleza, para escolher um serviço digite o número correspondente:

      *7* Corte de cabelo: R$ 100,00
      *8* Coloração de cabelo: R$ 140,00
      *9* Hidratação de cabelo: R$ 80,00
      *10* Tratamentos capilares específicos: à Consultar
      *11* Penteado para eventos especiais: R$ 100,00
      *12* Maquiagem para eventos especiais: R$ 90,00
      *13* Manicure e pedicure: R$ 80,00
      *14* Unhas em gel: R$ 50,00
      *15* Depilação: R$ 100,00
      *16* Design de sobrancelhas: R$ 70,00
      *17* Alongamento de cílios: R$ 40,00
      *18* Tratamentos de pele: R$ 120,00
      *19* Limpeza de pele: R$ 90,00
      *20* Massagem facial: R$ 80,00
      *21* Maquiagem para o dia-a-dia: R$ 70,00

      `);
    }

    else if (["3","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21"].includes(msg.body)) {
      msg.reply("*" + nomeContato + "*, " + `Ok, vou te mostrar os dias e horários disponíveis, escolha a opção desejada:
      
      *22*- Quinta-feira 04/06 às 13h
      *23*- Quinta-feira 04/06 às 14h
      *24*- Sexta-feira 05/06 às 10h
      *25*- Sexta-feira 05/06 às 11h
      *26*- Outras datas
      `);
    }

    else if (msg.body === "4") {
      msg.reply(`Certo ${nomeContato} já cancelei o seu agendamento, que pena que vc teve que cancelar :´( 
        Espero que vc possa agendar novamente conosco outro dia ;)`);
    }
    
    else if (msg.body === "5") {
      msg.reply("Seu contato já foi encaminhado para a Maria Chiquinha, em breve entraremos em contato com vc :) ");
    }
    
    else if (msg.body === "6") {
      msg.reply(`Obrigado por entrar em contato ${nomeContato} ` );
    }

    else if (["22","23","24","25"].includes(msg.body)) {
      msg.reply(`Tudo certo ${nomeContato}, seu horário já foi agendado, não se preocupe eu vou te mandar uma mensagem 1 dia antes para te lebrar, beleza? 
      Obrigado por escolher o salão de beleza da Maria Chiquinha
      `);
    }

    else if (msg.body === "26") {
      msg.reply(`Desculpe ${nomeContato}, não tenho mais horários disponíveis :´( `);
    }

    else if (msg.body !== null || msg.body === "0") {
      const saudacaoes = ['Olá ' + nomeContato + ', tudo bem?', 'Oi ' + nomeContato + ', como vai você?', 'Opa ' + nomeContato + ', tudo certo?'];
      const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
      msg.reply(saudacao + `
      Aqui é do salão de beleza da Maria Chiquinha, sou o seu antendente virtual, estou aqui para te atender a qualquer hora do dia.
      Vamos lá então, escolha uma das opções abaixo para iniciarmos a nossa conversa:
      
      *1*- Quero saber mais sobre o salão de beleza da Maria Chiquinha;
      *2*- Gostaria de conhecer os serviços;
      *3*- Gostaria de marcar um horário;
      *4*- Gostaria de cancelar um horário;
      *5*- Gostaria de falar com um(a)atendente;
      *6*- Sair do atendimento
      `);
    }
    
    /*
    else if (msg.body === "11") {
      
      const contact = await msg.getContact();
      setTimeout(function() {
        msg.reply(`@${contact.number}` + ' your contact has already been forwarded to Pedrinho');  
        client.sendMessage('5515998566622@c.us','Contato ZDG - EN. https://wa.me/' + `${contact.number}`);
      },1000 + Math.floor(Math.random() * 1000));
      
    }
    */

  });
  
  
  server.listen(port, function() {
    console.log('App running on *: ' + port);
  });
  