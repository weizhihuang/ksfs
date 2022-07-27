# Koa Simple File Sharing Service
> Simple http-based file sharing service built with Koa.

## Usage (API)

| Method | Path    | Remark                 |
| ------ | ------- | ---------------------- |
| GET    | /       | Upload Page            |
| GET    | /{name} | Download a File        |
| POST   | /       | Upload Unnamed file(s) |
| POST   | /{name} | Upload Named file(s)   |

### Parameters
| Name     | Type | Remark |
| -------- | ---- | ------ |
| file     | File |        |
| override | Bool |        |

### Response
```
[
    {
        "origin": "file1.txt",
        "target": "http://{url}/1507001873310ckqrbtbwawa"
    },
    {
        "origin": "file2",
        "target": "http://{url}/15070018733102c7moc3c7yp"
    },...
]
```

## Advanced
### Upload Named file(s)
When uploading a file to /{name}, you will get a target url with {name}.

When uploading two (or more) files to /{name}, you will get target urls with {name}_0, /{name}_1, etc.

### Override
When the target file exists, status 403 may appear, add the **override** parameter to replace the target file **IF YOU WANT**.

### File Types
For file types, please refer to https://github.com/sindresorhus/file-type#supported-file-types.
