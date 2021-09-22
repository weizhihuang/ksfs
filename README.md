# Koa Storage
> A simple storage system build with koa

## Usage (API)

| Method | URI     | Remark                           |
| ------ | ------- | -------------------------------- |
| GET    | /       | index                            |
| GET    | /{name} | download a file                  |
| POST   | /       | upload a unnamed file (or files) |
| POST   | /{name} | upload a named file (or files)   |

### Params
| Name     | Type | Remark    |
| -------- | ---- | --------- |
| file     | File |           |
| override | Bool | see above |

### Response
```
[
    {
        "origin": "file1.txt",
        "target": "http://localhost:3000/1507001873310ckqrbtbwawa"
    },
    {
        "origin": "file2",
        "target": "http://localhost:3000/15070018733102c7moc3c7yp"
    },...
]
```

## Note
### Upload named file
When uploading a file to /filename, you will get a target url /filename.

When uploading two (or more) files to /multiplefiles, you will get a with target urls /multiplefiles_0, /multiplefiles_1, etc.

### Override
It may occur status 403 when the target file exists.
Adding "override" param to update the target file.

### File types
About file types, you need to reference this: https://github.com/sindresorhus/file-type#supported-file-types.
