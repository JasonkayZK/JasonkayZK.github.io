---
title: 在Rust中使用SQLite和Migration
toc: true
cover: 'https://img.paulzzh.com/touhou/random?21'
date: 2023-07-11 21:39:16
categories: Rust
tags: [Rust, SQLite]
description: 最近需要用到 SQLite 数据库，这里简单总结一下；本文讲解了如何在 Rust 中使用 SQLite，以及对应的 Migration；
---

最近需要用到 SQLite 数据库，这里简单总结一下；

本文讲解了如何在 Rust 中使用 SQLite，以及对应的 Migration；

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/sqlite

<br/>

<!--more-->

# **在Rust中使用SQLite和Migration**

## **前言**

Rust 连接操作 SQLite 数据库，主要使用 rusqlite 这个 crate：

-   https://github.com/rusqlite/rusqlite

在 `Cargo.toml` 中添加一些依赖：

Cargo.toml

```toml
[dependencies]
rusqlite = "0.29.0"
rusqlite_migration = { version = "1.0.2" }

anyhow = "1"
lazy_static = "1.4.0"
include_dir = "0.7.3"
boost-rs = { version = "0.0.4", features = ["logger"] }
```

下面是会用到的一些其他依赖；

<br/>

## **创建Migration**

在实际项目中，通常情况下都会使用 Migration 进行数据库结构的版本控制；

这样在服务启动后，会自动创建、并维护数据库表结构等；

这里使用的的 crate 是：

-   https://github.com/cljoly/rusqlite_migration/

首先在项目根目录创建：

migrations/01-add-person/up.sql

```sql
CREATE TABLE person
(
    id   INTEGER PRIMARY KEY,
    name TEXT    NOT NULL,
    age  INTEGER NOT NULL DEFAULT 0,
    data BLOB
);
```

>   **目前 rusqlite_migration 还没有对外提供 [from-directory](https://github.com/cljoly/rusqlite_migration/tree/master/examples/from-directory) 从 Migration 直接加载；**

随后，在代码中加载这个文件，并作为 Migration：

storage/migration.rs

```rust
use anyhow::Result;
use include_dir::{include_dir, Dir};
use lazy_static::lazy_static;
use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

static MIGRATIONS_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/migrations");

const DATABASE_FILE: &str = "lifeline.db";

// Define migrations. These are applied atomically.
lazy_static! {
    static ref MIGRATIONS: Migrations<'static> = Migrations::new(
        MIGRATIONS_DIR
            .dirs()
            .map(|dir| {
                dir.files()
                    .find(|f| f.path().ends_with("up.sql"))
                    .map(|up_file| M::up(up_file.contents_utf8().unwrap()))
                    .unwrap()
            })
            .collect()
    );
}

pub fn init_db() -> Result<Connection> {
    let mut conn = Connection::open(DATABASE_FILE)?;

    // Update the database schema, atomically
    MIGRATIONS.to_latest(&mut conn)?;

    // Apply some PRAGMA. These are often better applied outside of migrations, as some needs to be
    // executed for each connection (like `foreign_keys`) or to be executed outside transactions
    // (`journal_mode` is a noop in a transaction).
    conn.pragma_update(None, "journal_mode", "WAL").unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();

    Ok(conn)
}

// Test that migrations are working
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrations_test() {
        assert!(MIGRATIONS.validate().is_ok());
    }
}
```

此时，在项目启动后，调用 `init_db` 会创建数据库连接，并且自动创建数据库表；

<br/>

## **使用SQLite**

上面的 Migration 完成的数据库表的创建和连接；

下面来使用 SQLite；

定义一个 Person 实体类：

entity/person.rs

```rust
#[derive(Debug)]
pub struct Person {
    pub id: i32,
    pub name: String,
    pub age: u8,
    pub data: Option<Vec<u8>>,
}
```

新增和查询语句：

storage/person.rs

```rust
use crate::entity::person::Person;
use anyhow::Result;
use rusqlite::{params, Connection};

pub fn add_person(conn: &Connection, person: &Person) -> Result<()> {
    conn.execute(
        "INSERT INTO person (name, age, data) VALUES (?1, ?2, ?3)",
        params![person.name, person.age, person.data],
    )
    .unwrap();

    Ok(())
}

pub fn get_persons(conn: &Connection) -> Result<Vec<Person>> {
    let mut stmt = conn.prepare("SELECT * FROM person")?;
    let persons = stmt.query_map([], |row| {
        Ok(Person {
            id: row.get(0)?,
            name: row.get(1)?,
            age: row.get(2)?,
            data: row.get(3)?,
        })
    })?;

    let mut ret_persons = Vec::new();
    for p in persons {
        ret_persons.push(p?);
    }
    Ok(ret_persons)
}
```

代码非常简单，不再赘述；

<br/>

## **代码测试**

在 main 函数中使用上面的定义，如下：

src/main.rs

```rust
mod entity;
mod storage;

use crate::entity::person::Person;
use crate::storage::migration::init_db;
use crate::storage::person::{add_person, get_persons};
use boost_rs::logger;
use boost_rs::logger::log::info;

fn main() {
    // Step 1: Init logger
    logger::init(Some(logger::LogLevel::Trace));

    // Step 2: Init database
    let conn = init_db().unwrap();

    // Use the db
    add_person(
        &conn,
        &Person {
            id: 0,
            name: "John".to_string(),
            age: 18,
            data: Some(Vec::from("test")),
        },
    )
    .unwrap();

    let persons = get_persons(&conn);
    info!("{:?}", persons);
}
```

首次执行时，由于没有数据库和表结构，因此会自动创建：

```
[DEBUG]: rusqlite_migration - some migrations defined, try to migrate
[DEBUG]: rusqlite_migration - some migrations to run, target_db_version: 1, current_version: 0
[TRACE]: rusqlite_migration - start migration transaction
[DEBUG]: rusqlite_migration - Running: CREATE TABLE person
(
    id   INTEGER PRIMARY KEY,
    name TEXT    NOT NULL,
    age  INTEGER NOT NULL DEFAULT 0,
    data BLOB
);

[TRACE]: rusqlite_migration - set user version to: 1
[TRACE]: rusqlite_migration - commited migration transaction
[ INFO]: rusqlite_migration - Database migrated to version 1
[ INFO]: rust_learn - Ok([Person { id: 1, name: "John", age: 18, data: Some([116, 101, 115, 116]) }])
```

再次执行一次：

```
[DEBUG]: rusqlite_migration - some migrations defined, try to migrate
[DEBUG]: rusqlite_migration - no migration to run, db already up to date
[ INFO]: rust_learn - Ok([Person { id: 1, name: "John", age: 18, data: Some([116, 101, 115, 116]) }, Person { id: 2, name: "John", age: 18, data: Some([116, 101, 115, 116]) }])
```

此时，由于表结构已经创建，我们的数据库版本没有变化，因此不需要创建数据库了！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/sqlite

文章参考：

-   https://www.cnblogs.com/yangxu-pro/p/15831836.html
-   https://rustwiki.org/zh-CN/rust-cookbook/database/sqlite.html

<br/>
