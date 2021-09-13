const logger = require('koa-logger');
const serve = require('koa-static');
const koaBody = require('koa-body');
const Koa = require('koa');
const fs = require('fs');
const app = new Koa();
const path = require('path');
const readChunk = require('read-chunk');
const fileType = require('file-type-ext');
const send = require('koa-send');


app.use(logger());
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 10 * 1024 * 1024
  }
}));

app.use(async function (ctx, next) {
  await next();
  if (ctx.body || !ctx.idempotent) return;
  ctx.redirect('/404.html');
});

app.use(serve(path.join(__dirname, '/public')));

app.use(async function (ctx, next) {
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

  ctx.body = ['/', ...fs.readdirSync(__dirname + '/storage')]
    .filter(path => path[0] !== '.')
    .map(path => `<a href="${path}">${path}</a>`)
    .join('<br>');
});

app.use(async (ctx) => {
  await send(ctx, ctx.path, { root: __dirname + '/storage' });
});

app.listen(3000);
console.info('listening on port 3000');
