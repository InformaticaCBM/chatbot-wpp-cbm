const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const opcoes = require('./opcoes.json');

const client = new Client({
    authStrategy: new LocalAuth(),
});

let timer;
const tempoParaChat = 60000;
let primeiroAcesso = true;
let respondeNomes = true;
let mensagensPassadas = [];
let responsavelFinanceiro;
let setorAtual;

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

function inicioConversa(chatId) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        client.sendMessage(chatId, "Chat encerrado devido à inatividade.");
        resetarEstadoAposFimChat();
    }, tempoParaChat);
}

function resetarEstadoAposFimChat() {
    primeiroAcesso = true;
    respondeNomes = true;
    mensagensPassadas = [];
    responsavelFinanceiro = null;
    setorAtual = null;
    clearTimeout(timer);
}

client.on('message', async message => {
    const chatId = message.from;
    inicioConversa(chatId);
    const ultimaMensagem = message.body;
    mensagensPassadas.push(ultimaMensagem);

    // Removendo números na primeira mensagem
    if (!isNaN(mensagensPassadas[0]) && primeiroAcesso) {
        mensagensPassadas.shift(); // Remove o primeiro elemento
    }

    // Mensagens padrão para novo acesso
    if (primeiroAcesso) {
        client.sendMessage(chatId, opcoes.mensagemPadrao_1);
        setTimeout(() => {
            client.sendMessage(chatId, opcoes.mensagemPadrao_2);
        }, 2000);
        primeiroAcesso = false;
        return;
    }

    // Armazenando o nome do responsável financeiro
    if (respondeNomes && mensagensPassadas[1]) {
        responsavelFinanceiro = mensagensPassadas[1];
        client.sendMessage(chatId, `Prazer, ${responsavelFinanceiro}! \n\n${opcoes.mensagemPadrao_3}`);
        respondeNomes = false;
        return;
    }

    // Processando opções de setores
    if (!isNaN(mensagensPassadas[2])) {
        const valorEscolhido = opcoes.opcoesSetores[ultimaMensagem];

        if (ultimaMensagem === '#') {
            const mensagemSetores = "Aqui estão os setores disponíveis:\n" +
                Object.entries(opcoes.opcoesSetores)
                    .map(([key, value]) => `${key} - ${value.replace("👉 ", "")}`)
                    .join('\n');
            client.sendMessage(chatId, mensagemSetores);
            setorAtual = null;
            return;
        }

        if (setorAtual) {
            const setorEscolhido = opcoes[setorAtual];
            if (!isNaN(ultimaMensagem) && setorEscolhido[ultimaMensagem]) {
                client.sendMessage(chatId, `Funcionou! Você escolheu a opção ${ultimaMensagem}`);
                return;
            }

            const mensagem = `Opções disponíveis para ${setorAtual}:\n` +
                Object.entries(setorEscolhido)
                    .map(([key, value]) => `${key} - ${value}`)
                    .join('\n');
            client.sendMessage(chatId, mensagem);
            return;
        }

        if (valorEscolhido) {
            setorAtual = valorEscolhido.replace("👉 ", "").toLowerCase();
            const setorEscolhido = opcoes[setorAtual];
            const mensagem = `${valorEscolhido}\n` +
                Object.entries(setorEscolhido)
                    .map(([key, value]) => `${key} - ${value}`)
                    .join('\n');
            client.sendMessage(chatId, mensagem);
        }
    }
});

client.initialize().catch(err => {
    console.error('Erro ao inicializar o cliente:', err);
});
