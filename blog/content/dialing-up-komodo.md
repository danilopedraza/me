+++
title = "Dialing up Komodo, my hobby programming language"
date = 2025-10-09

[taxonomies]
tags = ["komodo", "programming-languages", "functional-programming", "rust", "english"]
+++

In December 2023, I started building Komodo ([komodo-lang.org](https://komodo-lang.org)), a programming language (or runtime for one) designed around my preferences. This wasn't my first attempt at designing and implementing a programming language: I had tried it a couple of times before, either getting lost in complexity or simply giving up. I decided to give it another shot, also using the project as an excuse to learn Rust, a language I was becoming fascinated with. It also came in handy as a capstone project to complete my undergraduate degree, and I even won a "best project" award at my university.

Well, after almost two years, I'm still working on it! Komodo might not be that big of a deal, but it has been a great opportunity to learn a lot about compiler infrastructure, software engineering, and even about my own preferences when it comes to programming, specifically _how_ I reason about programs. It's clear that Komodo is now my baby, and I want it to keep growing. This post is just a declaration of my ideas and plans for the future of Komodo.

## How things are now

Right now, Komodo is just a proof of concept. It simply isn't mature enough to be used for any serious purpose... maybe as a toy. However, it works, and its behavior is sound. I'm also confident in my ability to improve it.

At the moment, Komodo has:

- Dynamic, weak typing
- A functional flavor
- The usual primitive types of a high-level language (including arbitrary-length integers, floats, and fractions)
- A tiny standard library with I/O, math functions, functional programming primitives, and a JSON parser/serializer
- A release with GNU/Linux binaries (dynamically linked!)

## How I want Komodo to be

I'm not aiming to turn Komodo into a production-ready tool. That will probably never happen. However, I want it to be more powerful. I'm thinking of two things: **speed** and **usability**. I see Komodo as a tool to write compute-intensive programs with little effort. Picture yourself trying to compute the value of a hard but simple numeric sequence, like the number of square animals ([OEIS A000105](https://oeis.org/A000105)). There are two main concerns here:

- Taking care of a lot of rules derived from working on a 2x2 grid
- Making your program fast - What's the highest number in the sequence you can get in a reasonable amount of time?

Maybe you can afford several months of computation, but not several years. And you want your program to take care of most of the details. Clearly, you can't get everything at the same time, so I'll explain how I want to achieve these goals.

### Speed: it has to be faster!

Period. And by this, I mean *aggressively* faster. I want it to take every possible advantage while still giving tons of flexibility and offloading responsibilities from the programmer. I'm approaching this through two features: type inference and automatic parallelism management.

#### Type inference

Komodo is gradually typed right now, but all the type analysis is being done at runtime. That made sense back when I was just exploring the semantics of the language. However, in its current state, Komodo would greatly benefit from adding a bunch of static analysis, particularly, type inference.

The language doesn't have many self-referential features - Komodo is not [homoiconic](https://en.wikipedia.org/wiki/Homoiconicity), and it can't access its own environment directly, so a lot of information can be inferred at compile time. Besides, Komodo is almost [simply typed](https://en.wikipedia.org/wiki/Simply_typed_lambda_calculus) (it doesn't have generics, and I plan to add unions), so there's plenty of room for experimentation combining compile-time and runtime optimizations.

#### Automatic parallelism management

I recently got my hands on a [paper](https://dl.acm.org/doi/pdf/10.1145/3632880) proposing a way to automate granularity control. They even tested the idea with an [SML compiler](https://github.com/MPLLang/mpl)! I want to try this in a more dynamic environment (Komodo, duh).

One of the key elements of this approach is flagging certain calls as potentially parallel at compile time (just by following the user's use of a primitive), and then deciding at runtime which of them should actually be parallelized. A challenge here is that these potentially parallel calls (named `pcall`s by the authors) must be cheap. That's the only major concern I can see from studying the paper. But we'll see! Maybe I'll have to ditch the idea altogether.

### Usability: it has to be easy to use!

Now, let's talk about the usability of the language. For me, this comes as an extension of the work that makes the language faster. With greater static analysis comes more information about the program, and with that, more opportunities to provide useful error messages and tips. My goal is for someone to be able to learn the language by fighting the compiler - by reading error messages and fix suggestions.

Also, with solid type inference, the programmer should be able to write their code with almost no type annotations, and with automatic parallelism management (if it ends up working), granularity control would be handled by the runtime environment.

## Let's get to work!

It seems there's only one thing to do: work! I'm already working on the type inference algorithm. If you're curious, you can check out the [source code](https://github.com/danilopedraza/komodo/)! That's all for this post. Bye. I love you.
