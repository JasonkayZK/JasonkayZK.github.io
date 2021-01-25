---
title: 使用Go构建GraphQL API
toc: true
cover: 'https://acg.toubiec.cn/random?56'
date: 2021-01-21 17:06:57
categories: Golang
tags: [Golang, GraphQL]
description: GraphQL是目前比较火热的技术，以高度灵活性著称；本文讲述了如何使用Go构建一个GraphQL的API；
---

GraphQL是目前比较火热的技术，以高度灵活性著称；

本文讲述了如何使用Go和MySQL构建一个GraphQL API；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/graphql

<br/>

<!--more-->

## **使用Go构建GraphQL API**

最近看到了一篇英文文章讲述了如何使用Go和PostgreSQL构建一个GraphQL的API：

-   [Building an API with GraphQL and Go](https://medium.com/@bradford_hamilton/building-an-api-with-graphql-and-go-9350df5c9356)

但是内容是自顶向下讲述的，对于不了解GraphQL的来说(比如我)，看起来可能云里雾里的，不知道在干嘛；

并且主要用的是PostgreSQL，我一般用的是MySQL，虽然两者区别没有那么大！

所以我决定，按照原文使用MySQL再重写一个实现，并且尝试着自底向上讲述如何使用Go构建一个GraphQL API，希望能讲明白吧！

<br/>

### **什么是GraphQL**

首先先介绍一下，什么是GraphQL；

需要明确的是，几乎所有的技术发展都是有需求背景的，GraphQL也不例外！

>   对于业务不断快速变化的今天，专注于CRUD的你有没有这样的感受：
>
>   产品A：加一个接口帮我查一下用户的这个…；
>
>   产品B：加一个接口帮我查一下用户的那个…；
>
>   ……

而且这些需求隔三岔五的来，恨不得让你想直接在前端写SQL直连数据库做查询了！

为了解决这样不断变化的需求，彻底解放后端频繁写各种查询SQL的场景，GraphQL应运而生！

#### **GraphQL的一个例子**

我们先来看一个例子：

这里有一个User类：

```go
// User shape
type User struct {
	ID         int
	Name       string
	Age        int
	Profession string
	Friendly   bool
}
```

前端需要根据Name查询并展示Name、Age属性；

那么我们的SQL可以这样写：

```mysql
SELECT name,age FROM `users` WHERE name=?;
```

此时产品又想展示Profession和Friendly，可以把SQL改为：

```mysql
SELECT name,age,profession,friendly FROM `users` WHERE name=?;
```

这时候产品由于某些原因(例如合规性等问题)又要修改展示内容，你还要再次修改SQL；

这还是单个User对象的查询，如果一个查询涉及到五六张表，十多个关系的查询，那么每天啥也不用干了，就帮产品写SQL就完事了！

如果使用了GraphQL你甚至都不需要改代码，只需要前端修改请求，获取他需要的内容即可，例如：

```json
// 查询name为kevin，字段为id,name,age,profession,friendly的数据
{
    "query": "{users(name:\"kevin\"){id,name,age,profession,friendly}}"
}
// 返回值
{
  "data": {
    "users": [
      {
        "age": 35,
        "friendly": true,
        "id": 1,
        "name": "kevin",
        "profession": "waiter"
      },
      {
        "age": 15,
        "friendly": true,
        "id": 5,
        "name": "kevin",
        "profession": "in school"
      }
    ]
  }
}


// 查询name为kevin，字段为friendly的数据
{
    "query": "{users(name:\"kevin\"){friendly}}"
}
// 返回值
{
  "data": {
    "users": [
      {
        "friendly": true
      },
      {
        "friendly": true
      }
    ]
  }
}
```

这就好像是前端直接写SQL调用一样，而后端再也不用修改SQL啦！

#### **GraphQL简介**

GraphQL 是一种针对 Graph（图状数据）进行查询特别有优势的 Query Language（查询语言），所以叫做 GraphQL。GraphQL 跟用作存储的 NoSQL 等没有必然联系，GraphQL 背后的实际存储可以选择 NoSQL 型或是 SQL 类型的数据库，甚至任意其它存储方式（例如文本文件、存内存里等等）；

**GraphQL 最大的优势是：查询图状数据。**

GraphQL 是 Facebook 发明的，用 Facebook 做例子，例如说，你要在 Facebook 上打开我的页面查看我的信息，你需要请求如下信息：

-   我的名字

-   我的头像

-   我的好友（按他们跟你的亲疏程度排序取前 6）：

-   -   好友 1 的名字、头像及链接
    -   好友 2 的名字、头像及链接
    -   ……

-   我的照片（按时间倒序排序取前 6）：

-   -   照片 1 及其链接
    -   照片 2 及其链接
    -   ……

-   我的帖子（按时间倒序排序）：

-   -   帖子 1：

    -   -   帖子 1 内容

        -   帖子 1 评论：

        -   -   帖子 1 评论 1：

            -   -   帖子 1 评论 1 内容
                -   帖子 1 评论 1 作者名字
                -   帖子 1 评论 1 作者头像

            -   帖子 1 评论 2：

            -   -   ……

            -   ……

    -   帖子 2：

    -   -   帖子 2 内容

        -   帖子 2 评论：

        -   -   ……

    -   ……

这是一个超级复杂的树状结构，如果我们用常见的 RESTful API 进行设计，每个 API 负责请求一种类型的对象，例如用户是一个类型，帖子是另一个类型，那就需要非常多个请求才能把这个页面所需的所有数据拿回来。而且这些请求直接还存在依赖关系，不能平行地发多个请求，例如说在获得帖子数据之前，无法请求评论数据；在获得评论数据之后，才能开始请求评论作者数据；

如何解决这种问题？一个简单粗暴的办法是专门写一个 RESTful API，请求上述树状复杂数据。但很快新问题就会出现。现在 Facebook 想要做一个新的产品，例如说是宠物，然后要在我的页面上显示我的宠物信息，那这个 RESTful API 的实现就要跟着改；

GraphQL 能够很好地解决这个问题，但前提是：**数据已经以图的数据结构进行保存！**

例如，上面说到的用户、帖子、评论是顶点，而用户跟用户发过的帖子存在边的关系，帖子跟帖子评论存在一对多的边，评论跟评论作者存在一对一的边。这时候如果新产品引入了新的对象类型（也就是顶点类型）和新的边类型，那没有关系。在查询数据时用 GraphQL 描述一下要查询的这些边和顶点就行，不需要去改 API 实现；

#### **GraphQL的不足**

俗话说得好：**没有银弹**；

-   出自：["No Silver Bullet – Essence and Accident in Software Engineering"](https://en.wikipedia.org/wiki/No_Silver_Bullet)

说完了 GraphQL 是什么和能解决什么问题，说说不够好的地方吧；

第一，Facebook 从来没有公开自己的 GraphQL 后端设计，使得大家必需要用第三方的，但体验显然不如我们在 Facebook 内部使用 GraphQL 好。我上面说了，数据必需已经以图的数据结构进行存储才有优势。Facebook 内部有非常好的后端做好了这件事情，而且还内置了基于隐私设置的访问控制。例如说你发的帖子有些是所有人可见的、有些是好友可见的、有些是仅同事可见的，我在打开你的页面时 Facebook 有一个中间层保证了根据我和你的关系我只能看到我该看到的帖子。GraphQL 在这一层之上，所以无论 GraphQL 怎么写我都不可能看到我不该看到的信息；

第二，并不是所有场景都适用于 GraphQL 的，有些很简单的事情就应该用 RESTful API 来实现；Facebook 内部用户增长部门的很多 API 都还不是 GraphQL，因为没必要迁移到 GraphQL。用户增长部门的 API 处理新用户注册、填写短信验证码之类的事情，这些事情都是围绕着一个用户的具体某项或多项信息发生的，根本没有任何图的概念。可以强行写作 GraphQL，但得不到显著的好处。既然老的 API 早就写好了，需要的时候做一些小改动，但没必要重写；

第三，GraphQL 尽管查询的数据是图状数据结构，但实际获得的数据视图是树状数据结构。每一个 GraphQL 查询或更新都有自己的根节点，然后所有的数据都是从根结点展开出去的。查询后获得的数据如果要在前端重新变回图的状态，那前端就不能简单地缓存查询得到的数据，必须用对用的 GraphQL 存储库，然后通过顶点的 ID 把不同节点之间的某些边重新连接起来；

<br/>

### **快速入门GraphQL**

下面是GraphQL的中国官网：

-   https://graphql.cn/

GraphQL定义了一套类似于TypeScript的**类型系统**(`Type System`)来描述你的数据：

```typescript
// 项目的type
type Project {
  name: String
  tagline: String
  contributors: [User] // 数组表示多个，type 为下面的 User
}

type User {
  name: String
  photo: String,
  friends: [User] // User 的朋友们， type 还是 User
}
```

接下来你可以把`GraphQL`的**查询语言**(`Queries`)当成是没有值只有属性的对象，返回的结果就是有对应值的对象，也就是标准的`JSON`：

```json
// 基于Queries，请求你所要的数据
{ // 查找 name 为 GraphQL 的 project
  project(name: "GraphQL") {
    tagline
  }
}
// 得到可预测的json结果
{
  "project": {
    "tagline": "A query language for APIs"
  }
}
```

简单看了一下GraphQL中是如何定义和查询数据的，下面我们来动手实现一个GraphQL API！

<br/>

### **使用Go构建API**

#### **创建数据库**

schema.sql

```mysql
CREATE DATABASE IF NOT EXISTS `go_graphql_db`;

USE `go_graphql_db`;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  id serial PRIMARY KEY,
  name VARCHAR (50) NOT NULL,
  age INT NOT NULL,
  profession VARCHAR (50) NOT NULL,
  friendly BOOLEAN NOT NULL
) ENGINE=InnoDB CHARSET=utf8mb4;

INSERT INTO users VALUES
  (1, 'kevin', 35, 'waiter', true),
  (2, 'angela', 21, 'concierge', true),
  (3, 'alex', 26, 'zoo keeper', false),
  (4, 'becky', 67, 'retired', false),
  (5, 'kevin', 15, 'in school', true),
  (6, 'frankie', 45, 'teller', true);
```

创建了一个叫做`go_graphql_db`的数据库，以及一个`users`表，并插入了几条数据；

#### **创建数据库Mapper映射**

mapper/mapper.go

```go
package mapper

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

// Db is our database struct used for interacting with the database
type Db struct {
	*sql.DB
}

// User shape
type User struct {
	ID         int
	Name       string
	Age        int
	Profession string
	Friendly   bool
}

// New makes a new database using the connection string and
// returns it, otherwise returns the error
func New(connString string) (*Db, error) {
	db, err := sql.Open("mysql", connString)
	if err != nil {
		return nil, err
	}

	// Check that our connection is good
	if err := db.Ping(); err != nil {
		return nil, err
	}

	fmt.Println("mysql connected!")

	return &Db{db}, nil
}

// ConnString returns a connection string based on the parameters it's given
// This would normally also contain the password, however we're not using one
func ConnString(host string, port int, user, passwd, dbName string) string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s",
		user, passwd, host, port, dbName,
	)
}

// GetUsersByName is called within our user query for graphql
func (d *Db) GetUsersByName(name string) []User {
	// Prepare query, takes a name argument, protects from sql injection
	stmt, err := d.Prepare("SELECT * FROM go_graphql_db.`users` WHERE name=?")
	if err != nil {
		fmt.Println("GetUserByName preparation Err: ", err)
	}

	// Make query with our stmt, passing in name argument
	rows, err := stmt.Query(name)
	if err != nil {
		fmt.Println("GetUserByName Query Err: ", err)
	}

	// Create User struct for holding each row's data
	var r User
	// Create slice of Users for our response
	var users []User
	// Copy the columns from row into the values pointed at by r (User)
	for rows.Next() {
		if err := rows.Scan(
			&r.ID,
			&r.Name,
			&r.Age,
			&r.Profession,
			&r.Friendly,
		); err != nil {
			fmt.Println("Error scanning rows: ", err)
		}
		users = append(users, r)
	}

	return users
}

```

mapper中定义了数据库连接、User结构，以及最重要的`GetUsersByName`方法用于根据name取出users表中的数据；

>   <font color="#f00">**这里为了展示方便，将数据库连接配置、User类和数据库查询放在了一个文件；**</font>
>
>   <font color="#f00">**实际上应该按职责拆分为不同的文件处理；**</font>

<br/>

### **API转为GraphQL**

经过上面的一步，我们就可以创建一个HTTP Server，并根据请求将对应name的数据查询，并序列化为Json格式返回响应；

但是对于GraphQL而言，还要更为麻烦一些：**我们需要将对数据库的直接查询转化为对GraphQL的查询，而由GraphQL对数据库进行查询；**

这里我们使用的库是：

-   [graphql-go/graphql](https://github.com/graphql-go/graphql)

为了使用这个库，我们需要创建一个Schema(类似于查询和映射规则)，并指定Fields和Fields中的Resolver：

-   Resolver：GraphQL从何处取得数据；
-   Fields：GraphQL映射的数据域；

代码如下：

gql/queries.go

```go
package gql

import (
	"github.com/graphql-go/graphql"
	"github.com/jasonkayzk/go-graphql-api/mapper"
)

// Root holds a pointer to a graphql object
type Root struct {
	Query *graphql.Object
}

// User describes a graphql object containing a User
var User = graphql.NewObject(
	graphql.ObjectConfig{
		Name: "User",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type: graphql.Int,
			},
			"name": &graphql.Field{
				Type: graphql.String,
			},
			"age": &graphql.Field{
				Type: graphql.Int,
			},
			"profession": &graphql.Field{
				Type: graphql.String,
			},
			"friendly": &graphql.Field{
				Type: graphql.Boolean,
			},
		},
	},
)

// NewRoot returns base query type. This is where we add all the base queries
func NewRoot(db *mapper.Db) *Root {
	resolver := Resolver{db: db}

	// Create a new Root that describes our base query set up. In this
	// example we have a user query that takes one argument called name
	root := Root{
		Query: graphql.NewObject(
			graphql.ObjectConfig{
				Name: "Query",
				Fields: graphql.Fields{
					"users": &graphql.Field{
						Type: graphql.NewList(User),
						Args: graphql.FieldConfigArgument{
							"name": &graphql.ArgumentConfig{
								Type: graphql.String,
							},
						},
						// Create a resolver holding our database. Resolver can be found in resolvers.go
						Resolve: resolver.UserResolver,
					},
				},
			},
		),
	}
	return &root
}

```

这里我们定义了一个Root类，其中包括了一个`graphql.Object`类型的对象，即一个GraphQL的映射对象，这个对象就是一个Schema；

在`NewRoot`方法中，创建了一个Root，并且指定了GraphQL配置：

```go
graphql.ObjectConfig{
    Name: "Query",
    Fields: graphql.Fields{
        "users": &graphql.Field{
            Type: graphql.NewList(User),
            Args: graphql.FieldConfigArgument{
                "name": &graphql.ArgumentConfig{
                    Type: graphql.String,
                },
            },
            Resolve: Resolver{db: db}.UserResolver,
        },
    },
},
```

上述代码定义了：

-   GraphQL映射对象名称为：`Query`；

-   Fields规定了GraphQL的查询域，并且Fields是可以嵌套的；

    上述的定义类似于：

    ```json
    "users": [
        {
            "age": 35,
            "friendly": true,
            "id": 1,
            "name": "kevin",
            "profession": "waiter"
        },
        {
            "age": 15,
            "friendly": true,
            "id": 5,
            "name": "kevin",
            "profession": "in school"
        }
    ]
    ```

    其中：User为上面代码中定义的GraphQL映射类；

-   Fields中包括了三个字段：

    -   Type：返回类型；
    -   Args：请求入参名及类型；
    -   Resolver：数据解析来源；

下面我们来看看这个Resolver：

gql/resolvers.go

```go
package gql

import (
	"github.com/graphql-go/graphql"
	"github.com/jasonkayzk/go-graphql-api/mapper"
)

// Resolver struct holds a connection to our database
type Resolver struct {
	db *mapper.Db
}

// UserResolver resolves our user query through a db call to GetUserByName
func (r *Resolver) UserResolver(p graphql.ResolveParams) (interface{}, error) {
	// Strip the name from arguments and assert that it's a string
	name, ok := p.Args["name"].(string)
	if ok {
		users := r.db.GetUsersByName(name)
		return users, nil
	}

	return nil, nil
}

```

Resolver就是通过取得在Args中定义的入参，调用了mapper的方法，真正查询了数据库，并返回数据；

最后，我们可以通过调用`graphql.Do`方法传入Schema和请求字符串完成查询；

为了简单起见，我封装了一个函数：

gql/gql.go

```go
package gql

import (
	"fmt"

	"github.com/graphql-go/graphql"
)

// ExecuteQuery runs our graphql queries
func ExecuteQuery(query string, schema graphql.Schema) *graphql.Result {
	result := graphql.Do(graphql.Params{
		Schema:        schema,
		RequestString: query,
	})

	if len(result.Errors) > 0 {
		fmt.Printf("Unexpected errors inside ExecuteQuery: %v", result.Errors)
	}

	return result
}

```

在上述ExecuteQuery函数中，其实就是使用请求字符串和Schema完成了查询；

最后我们来创建HTTP路由处理函数，使用GraphQL查询处理路由上的请求，并返回请求结果；

<br/>

### **创建HTTP路由处理函数**

下面我们创建一个HTTP路由处理函数：

handler/handler.go

```go
package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/render"
	"github.com/graphql-go/graphql"
	"github.com/jasonkayzk/go-graphql-api/gql"
)

// Handler will hold connection to the db as well as handlers
type Handler struct {
	GqlSchema *graphql.Schema
}

type reqBody struct {
	Query string `json:"query"`
}

// GraphQL returns an http.HandlerFunc for our /graphql endpoint
func (s *Handler) GraphQL() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check to ensure query was provided in the request body
		if r.Body == nil {
			http.Error(w, "Must provide graphql query in request body", 400)
			return
		}

		var rBody reqBody

		// Decode the request body into rBody
		err := json.NewDecoder(r.Body).Decode(&rBody)
		if err != nil {
			http.Error(w, "Error parsing JSON request body", 400)
		}

		// Execute graphql query
		result := gql.ExecuteQuery(rBody.Query, *s.GqlSchema)

		// render.JSON comes from the chi/render package and handles
		// marshalling to json, automatically escaping HTML and setting
		// the Content-Type as application/json.
		render.JSON(w, r, result)
	}
}

```

>   **虽然我们在这个项目中引入了`go-chi`框架，但是你不熟悉也没太大关系；**

在Handler中我们定义了一个`graphql.Schema`类型的对象，用于处理GraphQL请求；

`reqBody`用于解析请求json中的`query`字段(我们在这个字段中放入GraphQL请求字符串！)；

并且我们定义了一个可以处理HTTP请求的方法：`GraphQL`用于处理对应路由上的HTTP请求；

在`GraphQL`方法中，我们首先解析了请求体，拿出了`query`字段的值，即：GraphQL字符串；

随后使用上文中封装的`ExecuteQuery`函数，处理了请求，最后返回结果；

<br/>

### **启动服务器**

现在我们已经拥有了HTTP服务器、数据库mapper映射、GraphQL Schema等；

下面我们就来创建路由，并启动项目吧！

main.go

```go
package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/render"
	"github.com/graphql-go/graphql"

	"github.com/jasonkayzk/go-graphql-api/gql"
	"github.com/jasonkayzk/go-graphql-api/handler"
	"github.com/jasonkayzk/go-graphql-api/mapper"
)

func main() {
	// Initialize our API and return a pointer to our router for http.ListenAndServe
	// and a pointer to our db to defer its closing when main() is finished
	router, db := initializeAPI()
	defer db.Close()

	// Listen on port 4000 and if there's an error log it and exit
	if err := http.ListenAndServe(":4000", router); err != nil {
		log.Fatal(err)
	}
}

func initializeAPI() (*chi.Mux, *mapper.Db) {
	// Create a new connection to our pg database
	db, err := mapper.New(
		mapper.ConnString("127.0.0.1", 3306, "root", "123456", "go_graphql_db"),
	)
	if err != nil {
		log.Fatal(err)
	}

	// Create our root query for graphql
	rootQuery := gql.NewRoot(db)
	// Create a new graphql schema, passing in the the root query
	sc, err := graphql.NewSchema(
		graphql.SchemaConfig{Query: rootQuery.Query},
	)
	if err != nil {
		fmt.Println("Error creating schema: ", err)
	}

	// Create a handler struct that holds a pointer to our database as well
	// as the address of our graphql schema
	s := handler.Handler{
		GqlSchema: &sc,
	}

	// Create a new router
	router := chi.NewRouter()

	// Add some middleware to our router
	router.Use(
		render.SetContentType(render.ContentTypeJSON), // set content-type headers as application/json
		middleware.Logger,          // log API request calls
		middleware.DefaultCompress, // compress results, mostly gzip assets and json
		middleware.StripSlashes,    // match paths with a trailing slash, strip it, and continue routing through the mux
		middleware.Recoverer,       // recover from panics without crashing handler
	)

	// Create the graphql route with a Handler method to handle it
	router.Post("/graphql", s.GraphQL())

	return router, db
}

```

在main中，首先我们创建了数据库连接，随后使用在gql中定义的Query创建了一个Schema；

随后使用schema创建了一个我们定义的Server，最后我们创建了一个端点(Endpoint)为`/graphql`的路由，并返回了路由；

最后，指定了`4000`端口和`/graphql`路由，启动了Go中的HTTP Server；

<br/>

### **GraphQL API测试**

项目写完之后，我们可以启动项目并做请求测试；

使用下面的命令整理依赖：

```bash
$ go mod tidy
```

启动项目：

```bash
$ go run main.go
# 数据库成功连接！
mysql connected!
```

>   **如果你是clone的我的项目，则在启动之前需要在`main.go`中配置一下你自己的数据库连接；**

下面可以通过Postman或者curl的方式发送请求；

这里我用curl的方式：

```bash
$ curl --location --request POST 'http://127.0.0.1:4000/graphql' --header 'Content-Type: application/json' --data '{"query": "{users(name:\"kevin\"){id,name,age,profession,friendly}}"}'

# 返回结果
{
  "data": {
    "users": [
      {
        "age": 35,
        "friendly": true,
        "id": 1,
        "name": "kevin",
        "profession": "waiter"
      },
      {
        "age": 15,
        "friendly": true,
        "id": 5,
        "name": "kevin",
        "profession": "in school"
      }
    ]
  }
}

curl --location --request POST 'http://9.134.243.6:4000/graphql' --header 'Content-Type: application/json' --data '{"query": "{users(name:\"kevin\"){name,friendly}}"}'

# 返回结果
{
  "data": {
    "users": [
      {
        "friendly": true,
        "name": "kevin"
      },
      {
        "friendly": true,
        "name": "kevin"
      }
    ]
  }
}
```

实际上就是向url为`http://127.0.0.1:4000/graphql`的地址发送了一个Post请求，请求体为：

```json
{
    "query": "{users(name:\"kevin\"){id,name,age,profession,friendly}}"
}
```

即在query字段中是一个GraphQL请求表达式；

通过改变GraphQL表达式，我们得到了不同的响应结果！

实验成功！

<br/>

## **后记**

本文由浅入深讲述了GraphQL的基本使用方法，详细阅读了本文之后，你对于GraphQL是什么，以及如何在Go中使用GraphQL有了一定了解！

本文是基于本人个人学习和了解所写，如果有哪些错误，还请指出！

文章参考：

-   [Building an API with GraphQL and Go](https://medium.com/@bradford_hamilton/building-an-api-with-graphql-and-go-9350df5c9356)

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/graphql

<br/>