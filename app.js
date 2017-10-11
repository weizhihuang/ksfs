
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

  let files = ctx.request.body.files.file;
  if (files.length === undefined) {
    files = [files];
  }

  let result = [];
  files.map((file, key) => {
    const reader = fs.createReadStream(file.path);

    const buffer = readChunk.sync(file.path, 0, 4100);
    const ext = fileType(buffer) ? '.' + fileType(buffer).ext : '';

    let filePath, fileName;
    if (ctx.request.url === '/') {
      // create a random file name until not in use
      do {
        fileName = Date.now().toString() + Math.random().toString(36).substring(2) + ext;
        filePath = path.join(__dirname, 'storage', fileName);
      } while (fs.existsSync(filePath));
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
    if (ctx.request.url === '/') { // if named
      url += fileName;
    } else if (files.length > 1) { // if unamed and file > 1
      url += `_${key}`;
    }
    result.push({origin: file.name, url: url});
  });

  ctx.body = result;
});

// handle downloads

app.use(async (ctx) => {
  await send(ctx, ctx.path, { root: __dirname + '/storage' });
});

// listen

app.listen(3000);
console.log('listening on port 3000');
