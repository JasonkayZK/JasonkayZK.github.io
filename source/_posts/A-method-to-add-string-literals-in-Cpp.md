---
title: A method to add string literals in C++
toc: true
cover: 'https://img.paulzzh.com/touhou/random?3'
date: 2022-04-30 17:01:31
categories: C++
tags: [C++, String]
description: For historical reasons, and for compatibility with C, string literals are not standard library strings in C++. This passage shows a simple way to accomplish this.
---

For historical reasons, and for compatibility with C, string literals are not standard library strings in C++. 

This passage shows a simple way to accomplish this.

<br/>

<!--more-->

# **A method to add string literals in C++**

## **Preface**

First of all, here is my first tech passage in fully English.

So, i chose a very small topic as a new start, hope that you can follow my step to switch your `language setting` to a new foreign language.

Now, enjoy!

<br/>

## **Try add string literals by `+`**

### **A demo to reveal the question**

Considering code below:

```C++
string s = "hello" + ", world!";
```

The compiler rejected the code, add threw a error:

```
Invalid operands to binary expression ('const char[6]' and 'const char[9]')
```

**This is counter-intuitive!**

**Why we can’t add two string literals, since the STL has already overrided `+` operator for string?!**

<br/>

### **The reason why we can’t add**

Well, this is a historical problem: **C++ wants to be compatible with char array in C!**

According to ***C++ Primer***, we know that:

-   **All the string literals’ type in C++ is `const char[]`;**

And the code `string s="hello";` actually equals to the code below:

```C++
string s("hello");
```

In another word, we are use `basic_string(const _CharT* __s)` to construct a new string!

So, the code `"hello" + ", world!"` is invalid, because `literal string` is `const char[]`  type  and we can’t add two `const char[]` type!

<br/>

### **`"hello"` is the type of  `const char[6]`?**

If you are a C developer, the answer is obvious:

The C uses `char array` as the string.

So, to indicate this is a string, we added a special character `\0` at the end of the char array.

This is why `"hello"` is typed `const char[6]`;

<br/>

## **How to add literal string using `+`?**

Thanks to the operator override in C++, we can simply override the `""s` operator.

>   **Yes, not `""`, but `""s`!**

And the STL has already done this job for us!

So all we need to do is to use it as `using std::operator""s; `, and change our code as :

```c++
string s = "hello"s + ", world!";
```

Then we can compile the code, and use s as a string!

>   **Noticed that your compiler need to support C++11 at least!**

<br/>

## **Summary**

At last, here is a.summary.

Above the passage, we learnt:

-   **All the string literals’ type in C++ is `const char[]`;**
-   **The C uses `char array` as the string, and we added a special character `\0` at the end of the char array to mark it;**
-   **We can use the `std::operator""s` to add string literals in C++;**

<br/>

# **Appendix**

Reference:

-   https://www.v2ex.com/t/850206
-   C++ Primer


<br/>
