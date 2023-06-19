const path = require('path');
const app = require('express')();
const http = require('http');
const WebSocket = require('ws');
const { getNetworkIp } = require('./utils');

const server = http.createServer(app);

const competitors = new Map();

const wss = new WebSocket.Server({
  server
});

wss.on('connection', (ws) => {
  // 监听客户端发来的消息
  ws.on('message', (message) => {
    const { type, data } = JSON.parse(message);
    if (type === 'init') {
      ws.data = data;

      for (const [id, competitor] of competitors) {
        competitor.send(JSON.stringify({
          type: 'newPeople',
          data: data
        }));
      }

      ws.send(JSON.stringify({
        type: 'newPerson',
        data: [...competitors].map(competitor => competitor[1].data)
      }));

      competitors.set(data.id, ws);
    } else if (type === 'move') {
      for (const [id, competitor] of competitors) {
        if (id === data.id) {
          competitor.data.centerPosX = data.centerPosX;
          competitor.data.centerPosY = data.centerPosY;
        }
        competitor.send(JSON.stringify({
          type: 'move',
          data: data
        }));
      }
    } else if (type === 'beacon') {
      for (const [id, competitor] of competitors) {
        competitor.send(JSON.stringify({
          type: 'beacon',
          data: data
        }));
      }
    } else if (type === 'click') {
      const _competitor = competitors.get(data.id);
      const prevClip = _competitor.data.clip;
      if (prevClip) {
        _competitor.data.clip = prevClip - 1
        for (const [id, competitor] of competitors) {
          competitor.send(JSON.stringify({
            type: 'click',
            data: {
              ...data,
              clip: _competitor.data.clip
            }
          }));
        }
        if (!_competitor.data.clip) {
          setTimeout(() => {
            for (const [id, competitor] of competitors) {
              competitor.send(JSON.stringify({
                type: 'loadClip',
                data: {
                  id: data.id,
                  clip: _competitor.data.clip = 40
                }
              }));
            }
          }, 2000);
        }
      }
    } else if (type === 'bruise') {
      const _competitor = competitors.get(data.id);
      _competitor.data.HP--;
      if (!_competitor.data.HP) {
        for (const [id, competitor] of competitors) {
          competitor.send(JSON.stringify({
            type: 'over',
            data: {
              id: _competitor.data.id
            }
          }));
        }
      } else {
        for (const [id, competitor] of competitors) {
          competitor.send(JSON.stringify({
            type: 'bruise',
            data: {
              id: _competitor.data.id,
              HP: _competitor.data.HP
            }
          }));
        }
      }
    }
  });


  ws.on('close', () => {
    for (const [id, competitor] of competitors) {
      competitor.send(JSON.stringify({
        type: 'close',
        data: {
          id: ws.data.id
        }
      }));

      competitors.delete(ws.data.id);
    }
  });
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.get('/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/main.js'));
});
app.get('/background.jpg', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/background.jpg'));
});

//监听端口
const port = process.env.PORT || 8000;
// const host = getNetworkIp();
const host = 'localhost'
server.listen(port, host, () => {
  console.log(`服务器跑起来了~ @ http://${host}:${port}`);
});
