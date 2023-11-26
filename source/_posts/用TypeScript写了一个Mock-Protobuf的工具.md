---
title: 用TypeScript写了一个Mock Protobuf的工具
toc: true
cover: 'https://img.paulzzh.com/touhou/random?11'
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

<font color="#f00">**注意：当你同时使用  `include` and `exclude` 两个过滤器，`exclude` 会永远首先生效！**</font>

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

```bash
$ tree
.
├── commands
│   ├── generate.ts
│   ├── options.ts
│   └── serve.ts
├── index.ts
└── libs
    ├── configs.ts
    ├── filter.ts
    ├── mock.ts
    └── server.ts

2 directories, 8 files
```

-   index.ts 为执行入口；
-   commands 目录下存放子命令相关内容；
-   libs 目录下存放子命令实现相关内容；

<br/>

#### **命令行入口**

命令行入口为 index.ts：

index.ts

```typescript
#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const {Command} = require('commander');
const {DirOption, IncludeOption, ExcludeOption, PortOption, OutputPathOption, ConfigOption} = require('./commands/options')
const generate = require('./commands/generate');
const serve = require('./commands/serve');

const program = new Command();

let config = {};
// 配置文件如果存在则读取
if (fs.existsSync(path.resolve("mock-protobuf.config-demo.json"))) {
    config = path.resolve("mock-protobuf.config-demo.json");
}

program
    .name("mock-protobuf")
    .version("v1.1.1", "-v, --version")
    .description("A tool to mock protobuf");

program.command('s').alias('serve')
    .addOption(DirOption)
    .addOption(IncludeOption)
    .addOption(ExcludeOption)
    .addOption(PortOption)
    .addOption(ConfigOption)
    .action(serve).description("Create a mock server for the given protobuf");

program.command('g').alias('generate')
    .addOption(DirOption)
    .addOption(IncludeOption)
    .addOption(ExcludeOption)
    .addOption(OutputPathOption)
    .action(generate).description("Generate mock data for the given protobuf");

program.parse();
```

**代码首行 `#!/usr/bin/env node` 表示这是一个 node-cli 入口，这个是必须要加的！**

随后，解析配置文件、然后注册每个命令；

最后调用：`program.parse()`，解析命令行参数；

<br/>

#### **各个子命令入口**

commands 目录下存放了每个子命令、以及命令行参数的文件；

首先，由于某些命令行参数会被复用，因此在 options.ts 中定义了所有的命令行参数：

options.ts

```typescript
import {Option} from "commander";

let DirOption = new Option('-d, --dir <string>', 'the directory of the protobuf files').default('.');

let PortOption = new Option('-p, --port <number>', 'the port for the mock server').default(3333).env('PB_MOCK_PORT');

let IncludeOption = new Option('-i, --include <string>',
    'include the specific protobuf interfaces, multiple packages split by ",", ' +
    'such as: "packageName.serviceName.methodName"').default('');

let ExcludeOption = new Option('-e, --exclude <string>',
    'exclude the specific protobuf interfaces, multiple packages split by ",", ' +
    'such as: "packageName.serviceName.methodName"').default('');

let OutputPathOption = new Option('-o, --output <string>', 'output path for result').default('');

let ConfigOption = new Option('-c, --config <string>', 'the config file path').default('mock-protobuf.config.json');

module.exports = {DirOption, PortOption, IncludeOption, ExcludeOption, OutputPathOption, ConfigOption: ConfigOption};
```

这些参数和上面的功能介绍中一一对应；

随后是两个子命令的定义，对应上文中的 generate 和 serve：

generate.ts

```typescript
import {getMockTpl, loadProtobufDefinition} from "../libs/mock";
import mockjs from "mockjs";
import fs from 'fs-extra';
import path from "path";
import {
    filterProtobufDefinitions,
    getProtobufFiltersFromOptions, ProtobufMessage,
} from "../libs/filter";

interface GenerateCmdOptions {

    dir: string;

    include?: string | undefined;

    exclude?: string | undefined;

    output: string;
}

module.exports = (options: GenerateCmdOptions) => {
    // Step 1: Load protobuf definitions
    let pkgDefinition = loadProtobufDefinition(options.dir);

    // Step 2: Filter if necessary
    let [filteredMessages, _] = filterProtobufDefinitions(pkgDefinition, ...getProtobufFiltersFromOptions(options.include, options.exclude));

    // Step 3: Generate each messages
    filteredMessages.forEach((v: ProtobufMessage[]) => {
        // Step 3.2: Generate mocked protobuf message data
        for (let protobufMessage of v) {
            let mockTpl = getMockTpl(pkgDefinition, protobufMessage.packageName, protobufMessage.messageName, new Map(), undefined);
            let mockData = mockjs.mock(mockTpl);
            processMockData(options.output, protobufMessage, mockData);
        }
    });
}

function processMockData(outputPath: string, pbMessage: ProtobufMessage, mockedMessageData: any) {
    // Print the mock data to the console if no output path
    if (outputPath.length === 0) {
        console.log(`Mocked ${pbMessage.packageName}.${pbMessage.messageName}: \n${JSON.stringify(mockedMessageData, null, 2)}\n`);
        return
    }

    // Else async write the output
    let saveFilePath = path.posix.join(outputPath, pbMessage.packageName);
    fs.ensureDirSync(saveFilePath)
    fs.writeJSON(path.posix.join(saveFilePath, pbMessage.messageName + ".json"), mockedMessageData, err => {
        if (err) return console.error(err)
    })
}
```

serve.ts

```typescript
import {createServer, parse_response_value_from_config} from "../libs/server";

interface ServeCmdOptions {

    dir: string;

    include: string;

    exclude: string;

    port: number | undefined;

    config: string;
}

module.exports = function (options: ServeCmdOptions) {
    createServer(options.dir, {
        include: options.include,
        exclude: options.exclude,
        /*
          The param data is result of mock.js
          https://github.com/nuysoft/Mock
        */
        /**
         * Hack mock rules of template
         * @param key protobuf message key
         * @param type protobuf message key type (eg. string/int32/bool...)
         * @param random
         */
        responseHandlerMap: parse_response_value_from_config(options.config),
        hackMockTpl: (key, type, random) => {
            key = key.toLowerCase();
            const keyTypeHas = (k: string, t: string) =>
                type === t && key.indexOf(k) > -1;
            if (keyTypeHas('icon', 'string')) return '@image';
            else if (keyTypeHas('name', 'string')) return '@name';
            return '';
        }
    }).then(server => server.start(options.port));
}
```

**两个子命令都只是 export 了入口函数，用于在 index.ts 入口文件中注册子命令；**

**同时，两个子命令主要都是调用在 libs 中定义的函数，来完成各自的功能；**

下面来看各子命令的实现；

<br/>

#### **Generate子命令**

##### **Generate命令入口**

让我们自信看看 Generate 入口文件：

generate.ts

```typescript
interface GenerateCmdOptions {

    dir: string;

    include?: string | undefined;

    exclude?: string | undefined;

    output: string;
}

module.exports = (options: GenerateCmdOptions) => {
    // Step 1: Load protobuf definitions
    let pkgDefinition = loadProtobufDefinition(options.dir);

    // Step 2: Filter if necessary
    let [filteredMessages, _] = filterProtobufDefinitions(pkgDefinition, ...getProtobufFiltersFromOptions(options.include, options.exclude));

    // Step 3: Generate each messages
    filteredMessages.forEach((v: ProtobufMessage[]) => {
        // Step 3.2: Generate mocked protobuf message data
        for (let protobufMessage of v) {
            let mockTpl = getMockTpl(pkgDefinition, protobufMessage.packageName, protobufMessage.messageName, new Map(), undefined);
            let mockData = mockjs.mock(mockTpl);
            processMockData(options.output, protobufMessage, mockData);
        }
    });
}

function processMockData(outputPath: string, pbMessage: ProtobufMessage, mockedMessageData: any) {
    // Print the mock data to the console if no output path
    if (outputPath.length === 0) {
        console.log(`Mocked ${pbMessage.packageName}.${pbMessage.messageName}: \n${JSON.stringify(mockedMessageData, null, 2)}\n`);
        return
    }

    // Else async write the output
    let saveFilePath = path.posix.join(outputPath, pbMessage.packageName);
    fs.ensureDirSync(saveFilePath)
    fs.writeJSON(path.posix.join(saveFilePath, pbMessage.messageName + ".json"), mockedMessageData, err => {
        if (err) return console.error(err)
    })
}
```

首先，GenerateCmdOptions 接口定义了 Generate 命令所需要的命令行参数；

这些参数在命令行入口中可以被传递进来：

index.ts

```typescript
program.command('g').alias('generate')
    .addOption(DirOption)
    .addOption(IncludeOption)
    .addOption(ExcludeOption)
    .addOption(OutputPathOption)
    .action(generate).description("Generate mock data for the given protobuf");
```

<br/>

##### **加载Protobuf文件**

在 generate 命令中，首先通过 loadProtobufDefinition 函数加载指定目录下的 protobuf 文件：

libs/mock.ts

```typescript
export function loadProtobufDefinition(repository: string) {
    const absFilePaths = path.posix.join(repository, '**/*.proto');

    // Load all protobuf files under the repository
    const protoPaths = globby.sync([absFilePaths]);

    // Process each protobuf files, and solve semantic analysis errors caused by compatible annotations
    shell.sed('-i', /\/\*\/\//g, '/* //', protoPaths);
    return protoPaths.map(protoPaths => {
        const root = new protobuf.Root();
        return root.loadSync(protoPaths, {keepCase: true, alternateCommentMode: false, preferTrailingComment: false});
    });
}
```

上面的 loadProtobufDefinition 函数逻辑非常简单，首先查找所有的 proto 文件，随后加载；

其中使用 `shell.sed('-i', /\/\*\/\//g, '/* //', protoPaths);` 替换掉了文件中的注释行；

>   **protobuf.js 库对于某些含有注释的文件解析支持不够好！**

<br/>

##### **过滤Protobuf定义**

首先，调用 getProtobufFiltersFromOptions 函数根据命令行参数创建过滤条件：

随后调用 filterProtobufDefinitions 函数，过滤那些来自命令行 `-i` 和 `-e` 指定的 protobuf 定义；

libs/filter.ts

```typescript
export type ProtobufMessageFilter = RegExp[];

export function getProtobufFiltersFromOptions(includes?: string | undefined, excludes?: string | undefined):
    [ProtobufMessageFilter | undefined, ProtobufMessageFilter | undefined] {

    return [
        includes === undefined || includes.length === 0 ? undefined :
            includes.split(',').map(regExpStr => new RegExp(getRegExpString(regExpStr.trim()))),
        excludes === undefined || excludes.length === 0 ? undefined :
            excludes.split(',').map(regExpStr => new RegExp(getRegExpString(regExpStr.trim()))),
    ];
}

function getRegExpString(regExpStr: string): string {
    // Using prefix match for filters
    regExpStr = regExpStr.replace('\.', "\\.");
    return `^${regExpStr}`;
}
```

可以看到，getProtobufFiltersFromOptions 函数根据命令行传递的过滤条件生成了对应的 RegExp 数组，用于匹配路径；

filterProtobufDefinitions 函数：

libs/filter.ts

```typescript
export interface ProtobufMessage {
    data: ReflectionObject,
    packageName: string;
    serviceName: string;
    messageName: string;
}

// Filter the protobuf definitions
export function filterProtobufDefinitions(
    pbDefinitions: protobuf.Root[],
    includeFilters: ProtobufMessageFilter | undefined,
    excludeFilters: ProtobufMessageFilter | undefined,
): [Map<string, ProtobufMessage[]>, Map<string, ProtobufMessage[]>, Map<string, ProtobufMessage[]>] {

    let retMessageMaps = new Map<string, ProtobufMessage[]>();
    let retServiceMaps = new Map<string, ProtobufMessage[]>();
    let retMethodMaps = new Map<string, ProtobufMessage[]>();
    let repeatedSet = new Set<string>();
    for (let pbDefinition of pbDefinitions) {
        if (pbDefinition instanceof Namespace) {
            handleNamespace(pbDefinition.name, pbDefinition as Namespace,
                includeFilters, excludeFilters, retMessageMaps, retServiceMaps, retMethodMaps, repeatedSet);
        }
    }

    return [retMessageMaps, retServiceMaps, retMethodMaps];
}

function handleNamespace(namespace: string, pbDefinition: Namespace,
                         includeFilters: ProtobufMessageFilter | undefined,
                         excludeFilters: ProtobufMessageFilter | undefined,
                         retMessageMaps: Map<string, ProtobufMessage[]>,
                         retServiceMaps: Map<string, ProtobufMessage[]>,
                         retMethodMaps: Map<string, ProtobufMessage[]>,
                         repeatedSet: Set<string>) {

    for (let i = 0; i < pbDefinition.nestedArray.length; i++) {
        let item = pbDefinition.nestedArray[i];

        if (item instanceof Type) {
            pushItem(namespace, "", "Type", item, includeFilters, excludeFilters, retMessageMaps, repeatedSet);
        } else if (item instanceof Service) {
            pushItem(namespace, item.name, "Service", item, includeFilters, excludeFilters, retServiceMaps, repeatedSet);
            for (let method of item.methodsArray) {
                pushItem(namespace, item.name, "Method", method, includeFilters, excludeFilters, retMethodMaps, repeatedSet);
            }
        } else if (item instanceof Namespace) {
            handleNamespace(namespace === "" ? item.name : namespace + "." + item.name, item,
                includeFilters, excludeFilters, retMessageMaps, retServiceMaps, retMethodMaps, repeatedSet);
        }
    }

    return retMessageMaps;
}

function pushItem(namespace: string, serviceName: string, itemType: string, item: ReflectionObject,
                  includeFilters: ProtobufMessageFilter | undefined,
                  excludeFilters: ProtobufMessageFilter | undefined,
                  retMap: Map<string, ProtobufMessage[]>,
                  repeatedSet: Set<string>) {

    if (namespace !== "" && filterProtobuf(namespace + `.${item.name}`, includeFilters, excludeFilters)) {
        return;
    }

    let repeatStr = generateRepeatStr(namespace, serviceName, itemType, item.name);
    if (repeatedSet.has(repeatStr)) { // duplicate
        return;
    } else {
        repeatedSet.add(repeatStr);
    }

    if (retMap.has(namespace)) {
        retMap.get(namespace)!.push({
            data: item,
            packageName: namespace,
            serviceName: serviceName,
            messageName: item.name
        });
    } else {
        retMap.set(namespace, [{data: item, packageName: namespace, serviceName: serviceName, messageName: item.name}]);
    }
}

export function filterProtobuf(namespace: string, includeFilters: ProtobufMessageFilter | undefined,
                               excludeFilters: ProtobufMessageFilter | undefined): boolean {

    // Process for exclude filters first
    if (excludeFilters !== undefined) {
        if (matchFilters(namespace, excludeFilters)) {
            return true;
        }
    }

    // Process for include filters
    if (includeFilters !== undefined) {
        if (!matchFilters(namespace, includeFilters)) {
            return true;
        }
    }

    // Namespace has been not filtered, we pick it!
    return false;
}

function matchFilters(namespace: string, filters: ProtobufMessageFilter): boolean {

    return filters.some((filter) => filter.test(namespace));
}
```

在函数 filterProtobufDefinitions 中，主要是遍历 Proto 的定义，然后根据过滤条件过滤出最终的 Message、Service、Method 定义；

在其中定义的 repeatedSet 用于防止某些递归定义的 Protobuf，例如：

```protobuf
message BasicResponse {
  int32 status = 1;
  string message = 2;
  BasicResponse resp = 3;
}
```

在函数 filterProtobufDefinitions 中主要是调用 handleNamespace 来处理所有的 Protobuf 定义；

主要是区分为不同的 Protobuf 类型：

```typescript
for (let i = 0; i < pbDefinition.nestedArray.length; i++) {
  let item = pbDefinition.nestedArray[i];

  if (item instanceof Type) {
    pushItem(namespace, "", "Type", item, includeFilters, excludeFilters, retMessageMaps, repeatedSet);
  } else if (item instanceof Service) {
    pushItem(namespace, item.name, "Service", item, includeFilters, excludeFilters, retServiceMaps, repeatedSet);
    for (let method of item.methodsArray) {
      pushItem(namespace, item.name, "Method", method, includeFilters, excludeFilters, retMethodMaps, repeatedSet);
    }
  } else if (item instanceof Namespace) {
    handleNamespace(namespace === "" ? item.name : namespace + "." + item.name, item,
                    includeFilters, excludeFilters, retMessageMaps, retServiceMaps, retMethodMaps, repeatedSet);
  }
}
```

如果在 Proto 中的类型是 Namespace，那么我们还需要继续的递归调用 handleNamespace，来往下层继续搜索；

而 pushItem 函数用于将不同的 Proto 定义加入到结果集中：

```typescript
function pushItem(namespace: string, serviceName: string, itemType: string, item: ReflectionObject,
                  includeFilters: ProtobufMessageFilter | undefined,
                  excludeFilters: ProtobufMessageFilter | undefined,
                  retMap: Map<string, ProtobufMessage[]>,
                  repeatedSet: Set<string>) {

    if (namespace !== "" && filterProtobuf(namespace + `.${item.name}`, includeFilters, excludeFilters)) {
        return;
    }

    let repeatStr = generateRepeatStr(namespace, serviceName, itemType, item.name);
    if (repeatedSet.has(repeatStr)) { // duplicate
        return;
    } else {
        repeatedSet.add(repeatStr);
    }

    if (retMap.has(namespace)) {
        retMap.get(namespace)!.push({
            data: item,
            packageName: namespace,
            serviceName: serviceName,
            messageName: item.name
        });
    } else {
        retMap.set(namespace, [{data: item, packageName: namespace, serviceName: serviceName, messageName: item.name}]);
    }
}
```

在 pushItem 函数中，首先通过 Filters 对当前的 Proto 定义进行过滤，如果不满足条件，则直接返回；

而过滤的逻辑非常简单：首先判断是否是排除的，如果是，则直接过滤掉，否则判断是否是包含的；

```typescript
export function filterProtobuf(namespace: string, includeFilters: ProtobufMessageFilter | undefined,
                               excludeFilters: ProtobufMessageFilter | undefined): boolean {

    // Process for exclude filters first
    if (excludeFilters !== undefined) {
        if (matchFilters(namespace, excludeFilters)) {
            return true;
        }
    }

    // Process for include filters
    if (includeFilters !== undefined) {
        if (!matchFilters(namespace, includeFilters)) {
            return true;
        }
    }

    // Namespace has been not filtered, we pick it!
    return false;
}
```

这也满足了上面说介绍的：当你同时使用  `include` and `exclude` 两个过滤器，`exclude` 会永远首先生效！

随后，pushItem 函数调用 generateRepeatStr 创建去重字符串防止多次递归遍历同一个定义；

最后将定义加入到返回值 Map 中；

至此，过滤并获取 Protobuf 定义完成！

<br/>

##### **创建Mock数据**

最后，使用上面获取的 Protobuf 定义生成 Mock 数据：

```typescript
// Step 3: Generate each messages
filteredMessages.forEach((v: ProtobufMessage[]) => {
  // Step 3.2: Generate mocked protobuf message data
  for (let protobufMessage of v) {
    let mockTpl = getMockTpl(pkgDefinition, protobufMessage.packageName, protobufMessage.messageName, new Map(), undefined);
    let mockData = mockjs.mock(mockTpl);
    processMockData(options.output, protobufMessage, mockData);
  }
});
```

循环中首先通过 getMockTpl 获取到 Mock 对应 Protobuf 定义需要的模版，随后调用 mockjs.mock 生成 Mock 数据，最后调用 processMockData 保存 Mock 结果；

获取 Mock 模版的代码如下：

libs/mock.ts

```typescript
const TYPES: { [key: string]: string } = {
    double: '@float',
    float: '@float',
    int32: '@integer',
    int64: '@string("1234567890", 1, 20)',
    uint32: '@natural',
    uint64: '@string("1234567890", 1, 20)',
    sint32: '@integer',
    sint64: '@string("1234567890", 1, 20)',
    fixed32: '@natural',
    fixed64: '@string("1234567890", 1, 20)',
    sfixed32: '@integer',
    sfixed64: '@string("1234567890", 1, 20)',
    bool: '@boolean',
    string: '@sentence(1, 5)',
    bytes: '@sentence(1, 5)',
};

export function getService(
    pbDefinitions: protobuf.Root[],
    packageName: string,
    serviceName: string,
): Root | null | undefined {
    return pbDefinitions.find(pd => {
        try {
            pd.lookupService(`${packageName}.${serviceName}`);
            return true;
        } catch {
            return false;
        }
    });
}

export function getMethod(
    pbDefinitions: protobuf.Root[],
    packageName: string,
    serviceName: string,
    methodName: string
): Method | null | undefined {
    const service = getService(pbDefinitions, packageName, serviceName);
    return service?.lookup(methodName) as Method;
}

export function getMessage(
    pbDefinitions: protobuf.Root[],
    packageName: string,
    messageName: string
): protobuf.Type | undefined {
    return pbDefinitions
        .find(pd => {
            try {
                pd.lookupType(`${packageName}.${messageName}`);
                return true;
            } catch {
                return false;
            }
        })
        ?.lookupType(`${packageName}.${messageName}`);
}

export function getMockTpl(
    pbDefinitions: protobuf.Root[],
    packageName: string,
    messageType: string,
    mockMemo: Map<string, any>, // mockMemo to avoid recursive struct
    hackMockTpl?: (
        key: string,
        type: string,
        random: MockjsRandom
    ) => string | (() => string),
) {
    const messageTypeSplit = messageType.split('.');
    if (messageTypeSplit.length) {
        messageType = messageTypeSplit.pop()!;
        packageName = messageTypeSplit.join('.');
    }
    const message = getMessage(pbDefinitions, packageName, messageType);
    const fields = message?.fields || {};
    const keys = Object.keys(fields);
    const tpl: { [key: string]: any } = {};
    keys.forEach(key => {
        const val = fields[key];
        const {repeated, type} = val;
        const mockTpl =
            (hackMockTpl && hackMockTpl(key, type, Random)) || TYPES[type];
        key = `${key}${repeated ? '|0-10' : ''}`;

        let mockKey = `${packageName}.${messageType}.${key}`;

        if (mockMemo.has(mockKey)) {
            return;
        }

        mockMemo.set(mockKey, tpl); // memorize the key
        if (mockTpl) {
            tpl[key] = repeated ? [mockTpl] : mockTpl;
        } else {
            const recursiveMockTpl = getMockTpl(
                pbDefinitions,
                packageName,
                type,
                mockMemo,
                hackMockTpl
            );
            tpl[key] = repeated ? [recursiveMockTpl] : recursiveMockTpl;
        }
    });
    return tpl;
}
```

主要是对当前的 Protobuf 定义，递归的 Mock 包含的每一个字段；

同时，这里也使用到了 mockMemo 这个 Map 防止无限递归；

最后，通过 processMockData 函数处理 Mock 后的结果：

```typescript
function processMockData(outputPath: string, pbMessage: ProtobufMessage, mockedMessageData: any) {
    // Print the mock data to the console if no output path
    if (outputPath.length === 0) {
        console.log(`Mocked ${pbMessage.packageName}.${pbMessage.messageName}: \n${JSON.stringify(mockedMessageData, null, 2)}\n`);
        return
    }

    // Else async write the output
    let saveFilePath = path.posix.join(outputPath, pbMessage.packageName);
    fs.ensureDirSync(saveFilePath)
    fs.writeJSON(path.posix.join(saveFilePath, pbMessage.messageName + ".json"), mockedMessageData, err => {
        if (err) return console.error(err)
    })
}
```

如果：

-   没有指定输出文件，则将 Mock 的数据打印在控制台来直接 Copy；
-   指定了输出文件，则根据 Namespace 创建对应的目录，并保存 Mock 结果；

<br/>

#### **Serve子命令**

##### **Serve子命令入口**

Serve 子命令复用了上面大量的函数，这里来看下具体的实现；

类似的，首先是定义接收命令行参数的接口：

commands/serve.ts

```typescript
interface ServeCmdOptions {

    dir: string;

    include: string;

    exclude: string;

    port: number | undefined;

    config: string;
}

module.exports = function (options: ServeCmdOptions) {
    createServer(options.dir, {
        include: options.include,
        exclude: options.exclude,
        /*
          The param data is result of mock.js
          https://github.com/nuysoft/Mock
        */
        /**
         * Hack mock rules of template
         * @param key protobuf message key
         * @param type protobuf message key type (eg. string/int32/bool...)
         * @param random
         */
        responseHandlerMap: parse_response_value_from_config(options.config),
        hackMockTpl: (key, type, random) => {
            key = key.toLowerCase();
            const keyTypeHas = (k: string, t: string) =>
                type === t && key.indexOf(k) > -1;
            if (keyTypeHas('icon', 'string')) return '@image';
            else if (keyTypeHas('name', 'string')) return '@name';
            return '';
        }
    }).then(server => server.start(options.port));
}
```

随后调用 createServer 创建 Mock 的服务，并在创建完成后在指定的端口启动 Server；

<br/>

##### **创建Server**

创建Server的核心是要：**根据 Protobuf 的定义，Mock 相应 Method 的返回值以及请求路径；**

而关于 Mock 返回值，在上面 Generate 子命令中，我们已经实现了！

下面首先来看 createServer 的实现：

```typescript
export const createServer = async (protobufRepoPath: string, options: MockHandlerOptions) => {
    const server = restify.createServer();

    // CORS
    server.use((req: Request, res: Response, next: Next) => {
        res.header("Access-Control-Allow-Credentials", true);
        res.header("Access-Control-Allow-Origin", req.headers.origin);
        next();
    });

    // HANDLER
    const handlersMap = generateMockHandlersMap(protobufRepoPath, options);

    // API ROUTES
    server.opts("*", (req, res, next) => {
        res.header(
            "Access-Control-Allow-Methods",
            req.headers["access-control-request-methods"],
        );
        res.header(
            "Access-Control-Allow-Headers",
            req.headers["access-control-request-headers"],
        );
        res.end();
        next();
    });
    handlersMap.forEach((handler, routePath) => {
        console.log(`Handling routePath: ${routePath}`)
        server.get(routePath, handler);
        server.post(routePath, handler);
    })

    return {
        start: (port: number = 3333) =>
            server.listen(port, () =>
                console.log("%s listening at %s", server.name, server.url),
            ),
    };
};
```

通过 `restify.createServer()` 我们可以创建一个 Server，同时配置允许跨域的 header；

随后通过 generateMockHandlersMap 函数获取 routePath => Handler 的 Map；

然后注册各个方法，最后返回启动 Server 的函数；

下面重点来看获取 Handler 的函数 generateMockHandlersMap；

<br/>

##### **获取各个Handler**

获取各个 Handler 的方法和 Generate 子命令中的实现类似：

libs/server.ts

```typescript
interface MockHandlerOptions {
    include: string,
    exclude: string,
    responseHandlerMap?: Map<string, ResponseHandler>;
    hackMockTpl?: (
        key: string,
        type: string,
        random: MockjsRandom,
    ) => string | (() => string);
}

type ResponseHandler = (resp: restify.Response, data: any) => void;

function generateMockHandlersMap(
    repository: string,
    options: MockHandlerOptions,
): Map<string, RequestHandlerType> {
    const {include, exclude, responseHandlerMap, hackMockTpl} = options;

    // Step 1: Load protobuf definitions
    const pkgDefinition = loadProtobufDefinition(repository);

    // Step 2: Filter if necessary
    let [_, __, filteredMethodsMap] = filterProtobufDefinitions(pkgDefinition, ...getProtobufFiltersFromOptions(include, exclude));

    // Step 3: Bind methods to the mock server handler
    let retHandlersMap: Map<string, RequestHandlerType> = new Map;
    filteredMethodsMap.forEach((v: ProtobufMessage[]) => {

        // Step 3.1: Generate each handler from protobuf method data
        for (let protobufMethod of v) {
            // console.log(`protobufMethod: ${protobufMethod}`);
            let methodFullName = `${protobufMethod.packageName}.${protobufMethod.data.name}`;

            let handler = (req: Request, res: Response, next: Next) => {
                const method = getMethod(
                    pkgDefinition,
                    protobufMethod.packageName,
                    protobufMethod.serviceName,
                    protobufMethod.data.name,
                );
                const responseType = method?.responseType || "";
                const tpl = getMockTpl(
                    pkgDefinition,
                    protobufMethod.packageName,
                    responseType,
                    new Map(),
                    hackMockTpl,
                );
                const mockData = mockjs.mock(tpl);

                let customHandler = responseHandlerMap?.get(methodFullName);
                if (customHandler !== undefined) { // CustomHandler response handler
                    customHandler(res, mockData);
                } else { // We mock it
                    // console.log(mockData);
                    res.json(mockData)
                }

                next();
            };
            retHandlersMap.set(getRouthPath(protobufMethod.packageName,
                protobufMethod.serviceName,
                <Method>protobufMethod.data), handler);
        }
    });

    return retHandlersMap;
}

function getRouthPath(packageName: string, serviceName: string, method: Method): string {

    let parsedRouthPath = getRouthPathFromOptions(method);
    if (parsedRouthPath === "") {
        parsedRouthPath = `/${packageName.replace('.', '/')}` +
            `/${serviceName.replace('.', '/')}` +
            `${method.name}`;
    }
    return parsedRouthPath;
}

function getRouthPathFromOptions(method: Method): string {

    for (let reqType of ["get", "post"]) {
        let option = method.getOption(`(google.api.http).${reqType}`);
        if (option !== undefined) {
            return <string>option;
        }
    }
    return "";
}
```

在 generateMockHandlersMap 函数中，首先也是惊喜 Protobuf 定义的加载解析以及过滤操作；

随后遍历过滤之后的 MethodMap：为每个 Method Mock 请求参数，并获取请求路径；

这里需要注意的是：

如果 responseHandlerMap 中已经存在了自定义的响应，那么我们直接用这个即可：

```typescript
let customHandler = responseHandlerMap?.get(methodFullName);
if (customHandler !== undefined) { // CustomHandler response handler
  customHandler(res, mockData);
} else { // We mock it
  res.json(mockData)
}
```

同时，getRouthPath 函数用于获取请求路径：

```bash
function getRouthPath(packageName: string, serviceName: string, method: Method): string {

    let parsedRouthPath = getRouthPathFromOptions(method);
    if (parsedRouthPath === "") {
        parsedRouthPath = `/${packageName.replace('.', '/')}` +
            `/${serviceName.replace('.', '/')}` +
            `${method.name}`;
    }
    return parsedRouthPath;
}

function getRouthPathFromOptions(method: Method): string {

    for (let reqType of ["get", "post"]) {
        let option = method.getOption(`(google.api.http).${reqType}`);
        if (option !== undefined) {
            return <string>option;
        }
    }
    return "";
}
```

如果存在通过 `google.api.http` 定义的请求路径，那么我们用这个路径，否则，我们用 Protobuf 的包名来生成路径；

这一点和我们上面提到的功能是一致的！

<br/>

### **NPM上发布**

代码写完，并且测试 OK 了之后，可以发布到 NPM 仓库；

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
