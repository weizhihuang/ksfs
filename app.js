
/**
 * Module dependencies.
 */

const logger = require('koa-logger');
const serve = require('koa-static');
const koaBody = require('koa-body');
const Koa = require('koa');
const fs = require('fs');
const app = new Koa();
const os = require('os');
const path = require('path');
const readChunk = require('read-chunk');
const fileType = require('file-type');
const send = require('koa-send');

// log requests

app.use(logger());

app.use(koaBody({ multipart: true }));

// custom 404

app.use(async function(ctx, next) {
  await next();
  if (ctx.body || !ctx.idempotent) return;
  ctx.redirect('/404.html');
});

// serve files from ./public

app.use(serve(path.join(__dirname, '/public')));

// handle uploads

app.use(async function(ctx, next) {
  // ignore non-POSTs
  if ('POST' != ctx.method) return await next();

  const file = ctx.request.body.files.file;
  const reader = fs.createReadStream(file.path);

  const buffer = readChunk.sync(file.path, 0, 4100);
  const ext = fileType(buffer) ? '.' + fileType(buffer).ext : '';
  const fileName = Date.now().toString() + ext;

  // const stream = fs.createWriteStream(path.join(os.tmpdir(), Math.random().toString()));
  const stream = fs.createWriteStream(path.join(__dirname, 'storage', fileName));
  reader.pipe(stream);
  console.log('uploading %s -> %s', file.name, stream.path);

  ctx.body = { url: ctx.request.href + fileName };
});

// handle downloads

app.use(async (ctx) => {
  await send(ctx, ctx.path, { root: __dirname + '/storage' });
});

// listen

app.listen(3000);
console.log('listening on port 3000');
