const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const opcoes = require('./opcoes.json');

const client = new Client({
    authStrategy: new LocalAuth()
});

 // Variável para armazenar o timer

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

let primeiroAcesso = true;
let respondeNomes = true;
let mensagensPassadas = [];

var responsavelFinanceiro;
var aluno1;
var aluno2;

let timer;
const tempoParaChat = 300000; 

function inicioConversa(chatId) {
    timer = setTimeout(() => {
        client.sendMessage(chatId, "Chat encerrado devido à inatividade.");
        resetarEstadoApoFimChat();
    }, tempoParaChat);
}

function resetarEstadoApoFimChat() {
    primeiroAcesso = true;
    respondeNomes = true;
    mensagensPassadas = [];
    responsavelFinanceiro = null;
    aluno1 = null;
    aluno2 = null;
    clearTimeout(timer); 
}

client.on('message', async message => {
    const chatId = message.from;
    const ultimaMensagem = message.body;
    mensagensPassadas.push(ultimaMensagem);

    inicioConversa(chatId);

    if (!isNaN(mensagensPassadas[0]) && primeiroAcesso == true) {
        mensagensPassadas.splice(0, 1);
    } else {
        if (isNaN(mensagensPassadas[0]) && primeiroAcesso == true) {
            client.sendMessage(chatId, opcoes.mensagemPadrao_1);
            setTimeout(function () {
                client.sendMessage(chatId, opcoes.mensagemPadrao_2);
            }, 2000);
            primeiroAcesso = false;
        }

        if (mensagensPassadas[1] && primeiroAcesso == false && respondeNomes == true) {
            const divideNomesPassados = mensagensPassadas[1].split("\n");

            if (divideNomesPassados.length != 3) {
                client.sendMessage(chatId, "Não foi passado todos os valores necessários");
                setTimeout(function () {
                    client.sendMessage(chatId, opcoes.mensagemPadrao_2);
                }, 2000);
                mensagensPassadas.splice(1, 1);
            } else {
                responsavelFinanceiro = divideNomesPassados[0].toLowerCase();
                aluno1 = divideNomesPassados[1].toLowerCase();
                aluno2 = divideNomesPassados[2].toLowerCase();

                client.sendMessage(chatId, opcoes.mensagemPadrao_3);
                respondeNomes = false;
            }
        }

        if (!isNaN(ultimaMensagem) && primeiroAcesso == false) {
            const valorEscolhido = opcoes.opcoesSetores[ultimaMensagem];
            var valorEscolhidoFormatado = valorEscolhido.replace("👉 ", "").toLowerCase();
            const setorEscolhido = opcoes[valorEscolhidoFormatado];

            var mensagem = valorEscolhido + "\n";

            for (let key in setorEscolhido) {
                mensagem += `${key} - ${setorEscolhido[key]}\n`
            }
            client.sendMessage(chatId, mensagem);
        }
    }
});

// Inicializa o cliente
client.initialize().catch(err => {
    console.error('Erro ao inicializar o cliente:', err);
});