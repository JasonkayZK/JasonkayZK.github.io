---
title: 用TypeScript写了一个Mock Protobuf的工具
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?11'
date: 2022-10-07 16:23:20
categories: TypeScript
tags: [TypeScript, Protobuf, 工具分享]
description: 最近部门要搞API先行，后端定义好接口之后就要给前端Mock好数据。在网上找了关于Protobuf转JSON的工具，都没有找到。所以自己写了一个。
---

最近部门要搞API先行，后端定义好接口之后就要给前端Mock好数据；

在网上找了关于Protobuf转JSON的工具，都没有找到，所以自己写了一个；

源代码：

-   https://github.com/JasonkayZK/mock-protobuf.js

<br/>

<!--more-->

# **用TypeScript写了一个Mock Protobuf的工具**

## **使用**

使用 npm 安装：

```bash
npm i mock-pb-cli@latest -g
```

可以使用下面命令查看帮助：

```bash
$ mock-pb -h

Usage: mock-protobuf [options] [command]

A tool to mock protobuf

Options:
  -v, --version         output the version number
  -h, --help            display help for command

Commands:
  s|serve [options]     Create a mock server for the given protobuf
  g|generate [options]  Generate mock data for the given protobuf
  help [command]        display help for command
```

有两个子命令：

-   `mock-pb g` 或 `mock-pb generate`：Mock JSON 数据；
-   `mock-pb s` or `mock-pb serve`：Mock 服务；

<br/>

### **Mock JSON 数据**

Generate 子命令主要是用来生成 Mock 的 JSON 数据；

例如：

```bash
$ mock-pb g
```

上面的命令会获取当前工作目录下所有的 Proto 文件，并且将 Mock 的数据输出到终端；

例如：

```bash
Mocked demo.BasicResponse:
{
    "status": 902735693509892,
    "message": "Vmucue hqxllqx oiloapzwp.",
    "resp": {}
}

Mocked demo.DemoRequest:
{
    "data": "Kqr gxxq."
}

Mocked demo.DemoResponse:
{
    "resp": {
        "status": -6061376970430480,
        "message": "Xpjzjyxrcq eqkmytjo.",
        "resp": {}
    },
    "resp_data": "Ryogd tswayqjsf."
}
```

**默认情况下的 Protobuf 文件搜索路线为 `.`，你也可以使用 `-d` 来指定路径！**

例如：

```bash
$ mock-pb g -d ../test/proto
```

同时，**默认情况下 Mock 数据会打印到终端，你也可以使用 `-o` 来指定将 Mock 的数据输出到指定的目录！**

例如：

```bash
$ mock-pb g -o ./mock-pb-output
```

此时，`mock-pb-output` 目录下的结果为：

```bash
$ tree
.
├── demo
│   ├── BasicResponse.json
│   ├── DemoRequest.json
│   └── DemoResponse.json
├── google.api
│   ├── CustomHttpPattern.json
│   ├── HttpBody.json
│   ├── Http.json
│   └── HttpRule.json
└── google.protobuf
    ├── Any.json
    ├── Api.json
		......
    ├── SourceContext.json
    ├── Type.json
    └── UninterpretedOption.json
```

输出中的目录结构是根据 Proto 文件中的 `package` 来产生的！

<br/>

### **Mock服务**

#### **基本用法**

除了产生 Mock 的数据，也可以直接 Mock 服务接口；

下面的命令会读取当前工作目录下的 Proto 文件，并 Mock 在 Service 中定义了的 Method：

```bash
$ mock-pb s
```

输出如下：

```bash
Handling routePath: /Demo
Handling routePath: /demo/DemoServiceAnotherDemo
restify listening at http://[::]:3333
```

在服务端启动时，会打印出每个接口的请求路径；

>   **默认情况下的服务端口号为：`3333`，你可以使用 `-p` 来自定义端口；**
>
>   例如：
>
>   -   `mock-pb s -p 13333`

如果你在你的 Method 中通过 `google.api.http` 定义了请求路径，那么在 Mock 服务的时候会使用这个路径；

例如：

```protobuf
service DemoService {
  rpc Demo(DemoRequest) returns (DemoResponse) {
    option (google.api.http) = {
      post: "/Demo"
      body: "*"
    };
  }
}
```

如果没有指定请求路径，那么请求路径为：`/{ProtobufPackageName}/{ProtobufMethodName}`；

例如：

```protobuf
syntax = "proto3";

package demo;

service DemoService {
  rpc AnotherDemo(AnotherDemoRequest) returns (AnotherDemoResponse) {}
}
```

当服务启动后的请求路径为：

```bash
$ curl localhost:3333/demo/DemoServiceAnotherDemo
{"resp":{"status":-843357854531144,"message":"Vzby.","resp":{}},"resp_data":"Kvia gfkcggmuo."}
```

<br/>

#### **自定义返回值**

有时候你可能并不想 Mock 一些像下面这些无意义的数据：

```json
{"resp":{"status":-843357854531144,"message":"Vzby.","resp":{}},"resp_data":"Kvia gfkcggmuo."}
```

而是想要自定义一些有用的返回值，比如：

```json
{"resp":{"status":200,"message":"ok"},"resp_data":{"Message":"This is a demo message"}}
```

此时可以创建配置文件，例如：

mock-protobuf.config.json

```json
{
    "ResponseValue": [
        {
            "MethodName": "demo.Demo",
            "Data": {
                "Hello": "world"
            }
        },
        {
            "MethodName": "demo.AnotherDemo",
            "Data": {
                "resp": {
                    "status": 200,
                    "message": "ok"
                },
                "resp_data": {
                    "Message": "This is a demo message"
                }
            }
        }
    ]
}

```

其中 `MethodName` 是 Proto 文件中 Method 的全名：`package.method`；

同时，你也可以通过 `-c` 请求来指定你的配置文件路径，例如： `-c ./mock-protobuf.config.json`；

下面是一个完整的命令行例子：

```bash
$ npm run dev -- s -i demo -c ./mock-protobuf.config-demo.json
```

使用自定义返回值后的响应如下：

```bash
$ curl localhost:3333/Demo
{"Hello":"world"}

$ curl localhost:3333/demo/DemoServiceAnotherDemo
{"resp":{"status":200,"message":"ok"},"resp_data":{"Message":"This is a demo message"}}
```

<br/>

### **过滤条件**

有的时候我们并不想 Mock 所有的 Proto 定义，此时可以使用 Filter 过滤条件；

有两种方式进行过滤：

-   包含 Includes: `-i <string>` 或 `--include`;
-   不包含 Excludes: `-e <string>` 或 `--exclude`;

**上面的 `<string>` 被定义为一个JS中的正则表达式 `RegExp`，所以可以使用类似于正则表达式的方式对 Proto 定义进行匹配：`packageName.serviceName.methodName`；**

>   **多个条件使用 `,` 分隔！**

<br/>

#### **Include过滤条件**

当使用 Include 过滤条件，只有匹配的 Proto 定义才会被 Mock；

例如：

```bash
$ mock-pb g -i demo

Mocked demo.BasicResponse:
{
    "status": -978663427598816,
    "message": "Iymo zomttydmb.",
    "resp": {}
}

Mocked demo.DemoRequest:
{
    "data": "Mdnbfxbvoq khrbwyu sxmkev jss."
}

Mocked demo.DemoResponse:
{
    "resp": {
        "status": 6207610394471496,
        "message": "Dkwse mmhmuhhunb.",
        "resp": {}
    },
    "resp_data": "Fqwkd noiefpr ntjbcfydl."
}

Mocked demo.AnotherDemoRequest:
{
    "name": "Puvujqy kyxl hshuysly.",
    "age": 175838119803604
}

Mocked demo.AnotherDemoResponse:
{
    "resp": {
        "status": -7659482750118844,
        "message": "Fygec kyzysqqga svimupy nbfrjt.",
        "resp": {}
    },
    "resp_data": "Mpgjtjsbr qfspgkb xmpji."
}
```

上面的命令只会为 `demo.*` 产生 Mock 数据（即：package 为 demo 的那些定义）！

另外一个例子：

```bash
$ mock-pb g -i demo.DemoRequest.*

Mocked demo.DemoRequest:
{
    "data": "Ewqzspj hjkfvvc froqdhkwe fkqsdg dytidwli."
}
```

此时只会 Mock：`demo.DemoRequest` 这一个 Message！

<br/>

#### **Exclude过滤条件**

相反的，`-e` 产生将会排除那些匹配的 Message；

例如：

```bash
$ mock-pb g -e demo.*,google.protobuf.* -o mock-pb-gen

$ tree
.
└── google.api
    ├── CustomHttpPattern.json
    ├── HttpBody.json
    ├── Http.json
    └── HttpRule.json
```

上面的命令将不会 Mock  `demo.*` 和 `google.protobuf.*` 下的 Message！

<red>**注意：当你同时使用  `include` and `exclude` 两个过滤器，`exclude` 会永远首先生效！**</font>

例如：

```bash
$ mock-pb g -i demo -e demo
```

什么都不会输出，因为所有的内容都被过滤掉了！

<br/>

## **开发过程**

上面主要是讲解了 Mock 工具的使用方法；

下面总结了一下这个工具的整个开发过程，感兴趣的可以看看；

<br/>

### **项目配置**

项目目录结构如下（省略了一些无关的文件）：

```bash
$ tree
.
├── jest.config.js
├── package.json
├── proto
│   └── ...
├── src
│   ├── commands
│   │   ├── generate.ts
│   │   ├── options.ts
│   │   └── serve.ts
│   ├── index.ts
│   └── libs
│       ├── configs.ts
│       ├── filter.ts
│       ├── mock.ts
│       └── server.ts
├── tsconfig.json
└── tslint.json
```

目录结构非常简单：

-   `tslint.json`：一些 TS lint 相关的配置；
-   `tsconfig.json`：TS 编译相关配置；
-   `jest.config.js`：Jest 测试相关配置；
-   `package.json`：项目主配置；
-   `proto/`：项目提供的测试 Protobuf 文件；
-   `src/`：项目代码；

下面主要看 `package.json` 配置：

package.json

```json
{
    "name": "mock-pb-cli",
    "version": "v1.1.1",
    "scripts": {
        "c": "tsc",
        "serve": "ts-node src/index.ts",
        "dev": "ts-node-dev src/index.ts",
        "test": "jest",
        "cover": "jest --coverage"
    },
    "main": "src/index.ts",
    "bin": {
        "mock-pb": "bin/index.js"
    },
    "files": [
        "bin",
        "README.md"
    ],
    "devDependencies": {
        "@types/fs-extra": "^9.0.13",
        "@types/jest": "^24.0.13",
        "@types/mockjs": "^1.0.6",
        "@types/node": "^14.18.10",
        "@types/restify": "^8.5.5",
        "@types/shelljs": "^0.8.11",
        "@types/supertest": "^2.0.7",
        "jest": "^24.8.0",
        "supertest": "^4.0.2",
        "ts-jest": "^24.0.2",
        "ts-node": "^8.1.0",
        "ts-node-dev": "^2.0.0-0",
        "tslint": "^5.17.0",
        "typescript": "^4.8.2"
    },
    "dependencies": {
        "commander": "^9.4.0",
        "fs-extra": "^9.0.13",
        "globby": "^11.0.0",
        "mockjs": "^1.1.0",
        "protobufjs": "^7.1.0",
        "restify": "^8.6.1",
        "shelljs": "^0.8.5"
    }
}
```

在上面的配置中：

-   `name` & `version` 决定了发布到 NPM 后的名称和版本号；
-   `scripts`：声明了一些 `npm` 指令，可以通过 `npm run xxx` 执行；
-   `main`：作为项目入口的文件；
-   **`bin`（重要！）：作为 `node-cli` 的入口文件；注：`mock-pb` 为安装后的命令名称，`bin/index.js` 为命令的入口文件！**
-   `files`：npm 打包上传时包含的文件；
-   `devDependencies`：开发依赖，如果只使用 `npm -i` 安装，则不会安装这些依赖；
-   `dependencies`：项目依赖，使用 `npm -i` 安装，也会安装这些依赖；

**`devDependencies` 主要是一些 TS 库、test库等等，由于我们发布到 NPM 上的为编译好的 JS 文件，所以不需要这些 TS 库了！**

在我们的项目中，主要使用的是下面这些依赖：

-   **"commander"：知名的命令行解析、执行库；**
-   **"fs-extra"：封装了一些文件系统同步、异步操作库；**
-   **"globby"：匹配文件，用于匹配 proto 类型的文件；**
-   **"mockjs"：生成 Mock 数据；**
-   **"protobufjs"：解析 proto 文件；**
-   **"restify"：创建 Mock Server；**
-   **"shelljs"：一些 shell 命令的封装库，例如：`sed`；**

再看一下 TS 编译的配置：

tsconfig.json

```json
{
    "compilerOptions": {
        /* Basic Options */
        "target": "ES6",                     /* Specify ECMAScript target version: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017','ES2018' or 'ESNEXT'. */

        //  ts-node 目前不支持es2015的的模块机制
        //  https://github.com/TypeStrong/ts-node/issues/313#issuecomment-343698812
        "module": "commonjs",                     /* Specify module code generation: 'none', 'commonjs', 'amd', 'system', 'umd', 'es2015', or 'ESNext'. */

        "outDir": "./bin/",                        /* Redirect output structure to the directory. */
        "rootDir": "./src/",   /* input folder, and root dir cannot contain some ohter ts file which not in src folder*/

      	/* Strict Type-Checking Options */
        "strict": true,                           /* Enable all strict type-checking options. */

        /* Module Resolution Options */
        "moduleResolution": "node",            /* Specify module resolution strategy: 'node' (Node.js) or 'classic' (TypeScript pre-1.6). */
        "esModuleInterop": true,                   /* Enables emit interoperability between CommonJS and ES Modules via creation of namespace objects for all imports. Implies 'allowSyntheticDefaultImports'. */
        "experimentalDecorators": true       /* Enables experimental support for ES7 decorators. */
    },
    "exclude": [
      "./test"
    ]
}
```

主要关注：

-   **`outDir`：我们将文件编译至：`bin/` 目录下，和上面的 `bin` 以及 `files` 对应；**
-   **`rootDir`：我们 TS 文件的根目录；**

下面来看代码逻辑；

<br/>

### **代码逻辑**

在 src 目录下分为了两个目录：











<br/>

### **NPM上发布**

把包发布在 NPM 上非常简单；

首先注册一个账号，可以通过 Github 注册；

随后使用 `npm login` 登陆，然后执行 `npm publish` 即可发布！

-   https://www.npmjs.com/package/mock-pb-cli

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/mock-protobuf.js

参考文章：

-   https://cloud.tencent.com/developer/article/1947207

<br/>
