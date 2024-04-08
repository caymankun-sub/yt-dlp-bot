// sendResponse.js

const { InteractionResponseType } = require('discord-interactions');

async function sendDeferredResponse(res) {
  res.json({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  });
}

module.exports = sendDeferredResponse;
