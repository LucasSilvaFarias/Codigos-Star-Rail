const scriptProperties = PropertiesService.getScriptProperties();
const urls = {
  'hsr': '[URL API]'
};
const discord_notify = true;
const myDiscordID = scriptProperties.getProperty('DISCORD_ID');
const discordWebhook = scriptProperties.getProperty('WEBHOOK_URL');
let first_run = false;
let error = false;
const cdkeysbygame = fetchJson();
const last_execution = scriptProperties.getProperty('last_execution') || 0;

if (last_execution <= 0) first_run = true;

function fetchJson() {
  try {
    const response = UrlFetchApp.fetch('https://db.hashblen.com/codes');
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log(`Erro ao buscar JSON: ${e.message}`);
    throw new Error(`Erro ao buscar JSON: ${e.message}`);
  }
}

function main() {
  try {
    const hoyoResp = getCdkeys(urls);
    if (discord_notify && discordWebhook && hoyoResp.length > 0) sendDiscord(hoyoResp);
    scriptProperties.setProperty('last_execution', Date.now().toString());
    Logger.log('O código rodou sem problemas.');
  } catch (e) {
    Logger.log(`Erro na execução principal: ${e.message}`);
  }
}

function getCdkeys(urlDict) {
  let results = [];
  try {
    for (const game in urlDict) {
      const fullUrl = urlDict[game];
      if (!fullUrl) continue;
      const cdkeys = cdkeysbygame[game];
      cdkeys.forEach(function(cdkeydict) {
        if (!first_run && cdkeydict.added_at * 1000 < last_execution) return;
        results.push(`${game}: https://hsr.hoyoverse.com/gift?code=${cdkeydict.code}`);
      });
    }
  } catch (e) {
    Logger.log(`Erro ao obter códigos de ativação: ${e.message}`);
    throw new Error(`Erro ao obter códigos de ativação: ${e.message}`);
  }
  return results;
}

function discordPing() {
  return `<@${myDiscordID}> ${error ? 'Erro na execução do script, verifique os logs para mais detalhes.' : 'Códigos de ativação obtidos com sucesso!!'}`;
}

function sendDiscord(data) {
  let currentChunk = `${discordPing()}\n`;
  try {
    data.forEach(item => {
      if (currentChunk.length + item.length >= 1899) {
        postWebhook(currentChunk);
        currentChunk = '';
      }
      currentChunk += `${item}\n`;
    });
    if (currentChunk) postWebhook(currentChunk);
  } catch (e) {
    Logger.log(`Erro ao enviar dados para o Discord: ${e.message}`);
  }
}

function postWebhook(data) {
  try {
    const payload = JSON.stringify({
      username: "Hertinha",
      avatar_url: "https://i.imgur.com/ibrSmCn.png",
      content: data
    });
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(discordWebhook, options);
    Logger.log(`Posted to webhook, returned ${response}`);
  } catch (e) {
    Logger.log(`Erro ao postar no webhook: ${e.message}`);
  }
}
