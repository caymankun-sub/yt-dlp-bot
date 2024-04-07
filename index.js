const express = require('express');
const { InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');
const axios = require('axios');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

app.use(express.json());

// インタラクションを処理するエンドポイント
app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  console.log('Interaction received:', req.body); // リクエストのボディをログに出力

  const interaction = req.body;

  if (interaction.type === 1) {
    console.log('Received PING interaction'); // PING インタラクションを受信したことをログに出力

    // PING interaction
    res.json({
      type: InteractionResponseType.PONG
    });
  } else if (interaction.type === 2) {
    console.log('Received COMMAND interaction:', interaction.data.name); // コマンドインタラクションを受信したことをログに出力

    // Command interaction
    const commandName = interaction.data.name;

    if (commandName === 'yt') {
      console.log('Processing yt command'); // yt コマンドを処理していることをログに出力

      const url = interaction.data.options.find(option => option.name === 'url').value;
      const type = interaction.data.options.find(option => option.name === 'type').value;

      // Defer the initial response
      res.json({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      });

      try {
        const responseData = await fetchData(url, type);

        console.log('Received data:', responseData); // 受信したデータをログに出力

        const embed = {
          title: responseData.title,
          description: responseData.url,
          color: 0x0099ff,
          image: {
            url: responseData.thumbnail,
          },
        };

        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [embed],
          },
        });
      } catch (error) {
        console.error('An error occurred while fetching data:', error);
        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'An error occurred while fetching data.',
          },
        });
      }
    }

  } else {
    console.log('Received unknown interaction type:', interaction.type); // 未知のインタラクションタイプを受信したことをログに出力

    // Other interaction types
    res.status(400).end();
  }
});

// Endpoint for registering slash commands
app.put('/register-commands', async (req, res) => {
  console.log('Received command registration request'); // コマンド登録リクエストを受信したことをログに出力

  const commands = [
    {
      name: 'yt',
      description: 'Fetch information from YouTube URL',
      options: [
        {
          name: 'url',
          description: 'YouTube URL',
          type: 3,
          required: true,
        },
        {
          name: 'type',
          description: 'Type of content (video or audio)',
          type: 3,
          required: true,
          choices: [
            { name: '動画', value: 'video' },
            { name: '音楽', value: 'audio' },
          ],
        },
      ],
    },
  ];

  try {
    const response = await axios.put(`https://discord.com/api/v9/applications/${CLIENT_ID}/commands`, commands, {
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Commands registered:', response.data); // 登録されたコマンドをログに出力
    res.send('Commands have been registered');
  } catch (error) {
    console.error('Error registering commands:', error);
    res.status(500).send('Error registering commands');
  }
});

async function fetchData(url, type) {
  try {
    const response = await axios.get(
      `https://yt-dlp.cyclic.app/ogp?url=${encodeURIComponent(url)}&type=${type}`
    );
    return response.data;
  } catch (error) {
    return Promise.reject('Failed to fetch data');
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
