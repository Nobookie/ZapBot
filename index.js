import dotenv from 'dotenv';
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

dotenv.config();
const WHATSAPP_ADM = process.env.WHATSAPP_ADM || '';
const { Client, LocalAuth, MessageMedia } = pkg;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR Code acima com o WhatsApp para conectar.');
});

client.on('ready', () => {
    console.log('Cliente WhatsApp conectado e pronto!');
    recoverPendingPayments();
});

client.on('message', async msg => {
    try {
        if(msg.fromMe) return;

        const contact = await msg.getContact();
        const autor = contact.id.user.substring(2);

        if(msg.body.toLowerCase().startsWith('!')) {
            let noperm = false;
            const cmd = msg.body.toLowerCase().replace('!', '').split(' ');
            console.log(`O usuário ${autor} executou !${cmd[0]}`);
            switch(cmd[0]) {
                case 'ping':
                    if(WHATSAPP_ADM === '' || autor !== WHATSAPP_ADM) {
                        noperm = true;
                        break;
                    }
                    await client.sendMessage(msg.from, '_Pong!_');
                    break;
                default:
                    await client.sendMessage(msg.from, '_Comando não reconhecido._');
            }
            if(noperm === true){
                await client.sendMessage(msg.from, '_Você não tem permissão._');
                console.log(`O usuário ${autor} não tem permissão para executar !${cmd[0]}`);
            }
        } else {
            if(msg.isGif) return;
            if(msg.isStarred) return;
            if(msg.isStatus) return;
            if(msg.isEphemeral) return;
            if(msg.broadcast) return;
            if(msg.type !== pkg.MessageTypes.TEXT) return;
            const resposta = `_Desculpe, não estou mais utilizando este número para conversas. Salve o novo:_`;
            await client.sendMessage(msg.from, resposta);
            const novo = await client.getContactById("55" + WHATSAPP_ADM + "@c.us");
            await client.sendMessage(msg.from, novo);
            console.log(`Resposta automática enviada para ${autor}.`);
        }
    } catch (error) {
        console.error("Erro ao responder mensagem recebida:", error);
    }
});

try {
    await client.initialize();
} catch (err) {
    console.error("Erro ao inicializar o cliente:", err);
}

process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, encerrando...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Recebido SIGINT, encerrando...');
    process.exit(0);
});