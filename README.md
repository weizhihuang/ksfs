# koa-storage
> A simple storage system via koa

## Usage

| Method | URI     | Remark                           |
| ------ | ------- | -------------------------------- |
| GET    | /       | index                            |
| GET    | /{name} | download a file                  |
| POST   | /       | upload a unnamed file (or files) |
| POST   | /{name} | upload a named file (or files)   |

### params
| Name     | Type | Remark    |
| -------- | ---- | --------- |
| file     | File |           |
| override | Bool | see above |

```
[
    {
        "origin": "file1.txt",
        "url": "http://localhost:3000/1507001873310ckqrbtbwawa"
    },
    {
        "origin": "file2",
        "url": "http://localhost:3000/15070018733102c7moc3c7yp"
    },...
]
```

## Note

### Upload named file
When you upload a file to such like /filename, you will get a response /filename.

Then when you upload two(or more) files to /manyfiles, you will get a response that include /manyfiles0 and /manyfiles1.

### Override
Otherwise, maybe you will see status 403 and its response is "file exists".
It's actually that the file name already exists, maybe you can add a param named "override".

### File types
About file types, you need to reference that: https://github.com/sindresorhus/file-type#supported-file-types
