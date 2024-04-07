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

// 非同期関数: データを取得
async function fetchData(url, type) {
  try {
    const response = await axios.get(
      `https://yt-dlp.cyclic.app/ogp?url=${encodeURIComponent(url)}&type=${type}`
    );
    return response.data;
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    throw new Error('Failed to fetch data');
  }
}

app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  console.log('Interaction received:', req.body);

  const interaction = req.body;

  if (interaction.type === 1) {
    console.log('Received PING interaction');

    res.json({
      type: InteractionResponseType.PONG
    });
  } else if (interaction.type === 2) {
    console.log('Received COMMAND interaction:', interaction.data.name);

    const commandName = interaction.data.name;

    if (commandName === 'yt') {
      console.log('Processing yt command');

      const url = interaction.data.options.find(option => option.name === 'url').value;
      const type = interaction.data.options.find(option => option.name === 'type').value;

      // Deferred レスポンスを送信
      res.json({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      });

      try {
        // データの取得
        const responseData = await fetchData(url, type);
        if (responseData instanceof Error) {
          throw responseData;
        }

        console.log('Received data:', responseData);

        // データから Embed を作成
        const embed = {
          type: 'link',
          title: responseData.title,
          description: responseData.description, // 必要に応じて存在しない場合は削除しても構いません
          url: responseData.url,
          color: 0x0000FF,
          image: {
            url: responseData.thumbnail,
          },
          author: {
            name: responseData.uploader,
            url: responseData.uploader_url,
          },
        };


        // メッセージ内容
        const messageData = {
          embeds: [embed],
        };

        // InteractionからチャンネルIDを取得
        const channelID = interaction.channel_id;

        // Discord APIエンドポイント
        const messageEndpoint = `https://discord.com/api/v10/channels/${channelID}/messages`;

        // メッセージを送信
        await axios.post(messageEndpoint, messageData, {
          headers: {
            'Authorization': `Bot ${DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        // レスポンスを送信せずに終了
        return;
      } catch (error) {
        console.error('An error occurred while fetching data:', error);

        // エラーメッセージ
        const errorMessage = 'データの取得中にエラーが発生しました。後でもう一度試してみてください.';

        // メッセージ内容
        const errorData = {
          content: errorMessage,
        };

        // メッセージを送信
        await axios.post(messageEndpoint, errorData, {
          headers: {
            'Authorization': `Bot ${DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        // エラーレスポンスを送信せずに終了
        return;
      }
    }
  }
});

app.put('/register-commands', async (req, res) => {
  console.log('Received command registration request');

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

    console.log('Commands registered:', response.data);
    res.send('Commands have been registered');
  } catch (error) {
    console.error('Error registering commands:', error);
    res.status(500).send('Error registering commands');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
