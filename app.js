const logger = require('koa-logger');
const serve = require('koa-static');
const koaBody = require('koa-body');
const send = require('koa-send');
const Koa = require('koa');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readChunk = require('read-chunk');
const fileType = require('file-type-ext');
const portfinder = require('portfinder')
const argv = require('minimist')(process.argv.slice(2));
const opener = require('opener');

const app = new Koa();
const ifaces = os.networkInterfaces();

const port = argv.p || argv.port || parseInt(process.env.PORT, 10);
const host = argv.a;


app.use(logger());
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 10 * 1024 * 1024
  }
}));

app.use(async (ctx, next) => {
  await next();
  if (ctx.body || !ctx.idempotent) return;
  ctx.redirect('/404.html');
});

app.use(serve(path.join(__dirname, '/public')));

app.use(async (ctx, next) => {
  if (ctx.method !== 'POST') return await next();

  let files = ctx.request.body.files.file;
  if (!files.length) files = [files];

  const result = [];
  files.map((file, key) => {
    const reader = fs.createReadStream(file.path);
    const buffer = readChunk.sync(file.path, 0, 4100);
    let filePath, fileName;
    let ext = fileType(buffer)?.ext || '';

    if (file.name.includes('.') && (!ext || ext === 'zip')) {
      ext = file.name.split('.').pop();
    }

    if (ctx.request.url === '/') {
      if (ctx.request.body.fields['origin_name']) {
        fileName = file.name;
        filePath = path.join(__dirname, 'storage', fileName);
        if (fs.existsSync(filePath)) {
          ctx.throw(403, 'file exists');
        }
      } else {
        do {
          fileName = Date.now().toString() + Math.random().toString(36).substring(2) + (ext && '.' + ext);
          filePath = path.join(__dirname, 'storage', fileName);
        } while (fs.existsSync(filePath));
      }
    } else {
      fileName = ctx.request.url;
      fileName += files.length === 1 ? '' : `_${key}`;
      filePath = path.join(__dirname, 'storage', fileName);
      if (fs.existsSync(filePath) && !ctx.request.body.fields.override) {
        ctx.throw(403, 'file exists');
      }
    }

    const stream = fs.createWriteStream(filePath);
    reader.pipe(stream);
    console.log('uploading %s -> %s', file.name, stream.path);
    let url = ctx.request.href;
    if (ctx.request.url === '/') {
      url += fileName;
    } else if (files.length > 1) {
      url += `_${key}`;
    }
    result.push({ origin: file.name, target: url });
  });
  ctx.body = result;
});

app.use(async (ctx, next) => {
  if (ctx.request.url !== '/list') return await next();
  if (argv.list === false) ctx.redirect('/404.html');

  ctx.body = ['/', ...fs.readdirSync(__dirname + '/storage')]
    .filter(path => path[0] !== '.')
    .map(path => `<a href="${path}">${path}</a>`)
    .join('<br>');
});

app.use(async (ctx) => {
  await send(ctx, ctx.path, { root: __dirname + '/storage' });
});


if (port) {
  listen(port);
} else {
  portfinder.getPort({ port: 3000 }, (err, port) => {
    if (err) throw err;
    listen(port);
  });
}

function listen (port) {
  app.listen(port, host);

  console.info('\nAvailable on:');
  if (host) {
    urlInfo(host, port);
  } else {
    Object.keys(ifaces).forEach(dev => {
      ifaces[dev].forEach(({ address, family }) => {
        if (family === 'IPv4') urlInfo(address, port);
      });
    });
  }

  if (argv.open) {
    opener(`http://${host || '[::1]'}:${port}`);
  }
}

function urlInfo(host, port) {
  console.info(`  http://${/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host) ? host : '['+host+']'}${port === 80 ? '' : ':' + port}`)
}
