---
title: What is object slicing?
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?44'
date: 2022-05-03 17:42:38
categories: C++
tags: [C++]
description: In this passage we will talk about Object Slicing in C++(A very common occurrence in OOP).
---

Source Code:

-   https://github.com/JasonkayZK/cpp-learn/blob/jupyter/oop/object_slicing.ipynb

In this passage we will talk about Object Slicing in C++(A very common occurrence in OOP).

<br/>

<!--more-->

# **What is object slicing?**

Before we talk the Object Slicing, let’s see a example first:

```C++
#include <iostream>

class Base {
public:
    explicit Base(int mVal) : m_val_(mVal) {}

    [[nodiscard]] virtual const char *get_name() const { return "Base"; }

    [[nodiscard]] int get_m_val() const { return m_val_; }

protected:
    int m_val_;
};

class Derived : public Base {
public:
    explicit Derived(int mVal) : Base(mVal) {}

    [[nodiscard]] const char *get_name() const override { return "Derived"; }
};

int main() {
    Derived derived{5};
    std::cout << "derived is a " << derived.get_name() << " and has value " << derived.get_m_val() << '\n';

    Base &ref{derived};
    std::cout << "ref is a " << ref.get_name() << " and has value " << ref.get_m_val() << '\n';

    Base *ptr{&derived};
    std::cout << "ptr is a " << ptr->get_name() << " and has value " << ptr->get_m_val() << '\n';

    return 0;
}
```

In the example above, i created a `Base` class and `Derived` class (based on `Base`);

Then, i created a `derived` object from `Derived` class, and two other variable:

-   `derived` to `Base` type reference;
-   `derived` to `Base` type pointer;

Finally, we call `get_name` and `get_m_val` via these three variables. And it is obvious that:

-   All `get_name` returns `"Derived"`;
-   All `get_m_val` returns `5`;

This is because: dual to the inheritance from `Base`, the variable `derived` inherits the `m_val_` from `Base` .

**And even though we defined `ref` as `&Base` and `ptr` as `*Base` separately, but finally they all pointed to the variable: `derived`!**

<br/>

**But this is an exception: `Copy Constructor!`**

In the above example, we created `reference` and `pointer` from variable `derived`;

But what if we create a new object by **Copy constructor**:

```C++
Base base{derived};
std::cout << "base is a " << base.get_name() << " and has value " << base.get_m_val() << '\n';
```

The code above will finally print:

```C++
base is a Base and has value 5
```

>   **Remember that:**
>
>   <font color="#f00">**The derived object has a base part and a derived part.**</font>
>
>   <font color="#f00">**When we assign the derived object to the base object, ONLY the base part will be copied, and the derived part will not (Via Copy Constructor).**</font>
>
>   <font color="#f00">**In the above example, the base object receives a copy of the base part of a derived object, but ignores the derived part. The derived part is sliced off.**</font>
>
>   <font color="#f00">**This is so called `Object Slicing`!**</font>

<br/>

## **Object Slicing in function call**

In the above example you may think it stupid, because hardly nobody assigns derived classes to base classes.

But it is most likely when you are doing some function call:

```C++
void printName(const Base base) { // note: base pass by value, not reference
    std::cout << "I am a " << base.get_name() << '\n';
}

Derived d{ 5 };
printName(d);
```

This code will finally print:

```C++
I am a Base
```

Dual to we passed value (which will be copied), not reference to the function.

This can be simply fix that we just need to pass the reference:

```C++
void printName(const Base &base) { // note: base pass by reference
    std::cout << "I am a " << base.get_name() << '\n';
}
```

This will print:

```
I am a Derived
```

<br/>

## **Object Slicing in Vector(Or Collection)**

Another area where new programmers run into trouble with object slicing is trying to implement polymorphism with std::vector.

Consider the following program:

```C++
std::vector<Base> v{};
v.push_back(Base{ 5 }); // All a Base object into vector
v.push_back(Derived{ 6 }); // All a Derived object into vector
for (const auto& element : v)
  std::cout << "I am a " << element.get_name() << " with value " << element.get_m_val() << '\n';
```

This will print:

```
I am a Base with value 5
I am a Base with value 6
```

**Obviously, because `std::vector`  is declared as a base type, when `Derived(6)` is added to vector, it has been sliced!**

 <br/>

### **Fix Object Slicing in Vector**

Unfortunately, we can not just create a reference type `std:vector` like this:

```C++
std::vector<Base&> v{};
```

This will not compile:

<font color="#f00">**The object of `std::vector` must be assignable, but the reference cannot be assigned (the reference can be assigned only at initialization)!**</font>

One solution to solve this problem is to create a pointer type `std::vector`:

```C++
std::vector<Base *> v2{};

Base b{5}; // b and d show be initiate explicitly!
Derived d{6};

v2.push_back(&b);
v2.push_back(&d);

for (const auto *element: v2)
  std::cout << "I am a " << element->get_name() << " with value " << element->get_m_val() << '\n';
```

This will print:

```
I am a Base with value 5
I am a Derived with value 6
```

It works!

But dual to the complexity of the pointer, there are more things we should care of:

-   **Nullpter is now a legal option and may or may not be appropriate for your use scenario!**
-   **Now you have to operate with the pointer, which may be awkwardly!**

<br/>

## **The Frankenobject**

In the above examples, we’ve seen cases where slicing lead to the wrong result because the derived class had been sliced off. 

Now let’s take a look at another dangerous case where the derived object still exists!

Consider the following code:

```C++
Derived dd1{ 5 };
Derived dd2{ 6 };
Base &bb{ dd2 };

bb = dd1; // cause problem
std::cout << "I am a " << bb.get_name() << " with value " << bb.get_m_val() << '\n';
```

The first three lines in the function are pretty straightforward: 

-   Create two Derived objects, and set a Base reference to the second one.

The fourth line is where things go astray: **Since bb points at dd2, and we’re assigning dd1 to bb.**

**you might think that the result would be that dd1 would get copied into dd2 (it would, if b were a Derived!).**

But b is a Base, and the `operator=` that C++ provides for classes isn’t virtual by default.

Consequently, **only the Base portion of d1 is copied into d2.**

As a result, you’ll discover that: **d2 now has the Base portion of d1 and the Derived portion of d2!** 

In this particular example, that’s not a problem (because the Derived class has no data of its own).

But in most cases, you’ll have just created a `Franken Object`: composed of parts of multiple objects. 

Worse, there’s no easy way to prevent this from happening (other than avoiding assignments like this as much as possible).

<br/>

## **Google Style Guide**

A wisable choice to simply avoid this problem is to forbid the `Copy & Move Constructor` explicitly, if your type do not need them:

```C++
class Base {
public:
    explicit Base(int mVal) : m_val_(mVal) {}

    [[nodiscard]] virtual const char *get_name() const { return "Base"; }

    [[nodiscard]] int get_m_val() const { return m_val_; }

    // Base is neither copyable nor movable.
    Base(const Base&) = delete;
    Base& operator=(const Base&) = delete;

protected:
    int m_val_;
};
```

By adding these code:

```C++
// Base is neither copyable nor movable.
Base(const Base&) = delete;
Base& operator=(const Base&) = delete;
```

we declared that: Base is neither copyable nor movable!

Then this program will be not compiled:

```C++
Derived dd1{ 5 };
Derived dd2{ 6 };
Base &bb{ dd2 };

bb = dd1; // cause problem
```

Because Base is neither copyable nor movable now!

<br/>

## **Conclusion**

In this passage, first i gave two examples to introduce what is Object Slicing.

Then, I gave three typical and common mistakes:

-   Object Slicing in function call
-   Object Slicing in vector
-   Object Slicing to cause Franken Object

And the corresponding solutions.

Finally, be referred Google Style Guide, a usual principle to avoid this mistake is to forbid the copy and move constructor.

<br/>

# **Appendix**

Source Code:

-   https://github.com/JasonkayZK/cpp-learn/blob/jupyter/oop/object_slicing.ipynb

Reference:

-   https://learncppcn.github.io/18-virtual-functions/18.8-object-slicing/
-   https://en.wikipedia.org/wiki/Object_slicing


<br/>
