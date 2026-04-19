# [Project name] — Product requirements

## Vision

[One paragraph. What is this, who is it for and what problem does it solve? This is the north star: agents will reference it when making judgment calls.]

> **Example:** An ATM is a self-service terminal that lets bank customers withdraw cash, check balances, and make deposits without a human teller. It exists so customers can access their money outside banking hours and at locations away from branches. Every design decision should optimize for speed and confidence — the customer wants to be done in under a minute and certain their money is safe.

## Goals

[What are you trying to achieve with this project? Is it a personal project? Do you just need an MVP? Is it enterprise software (hahaha)? What platforms should it run on? Are there specific tools or services you want to use?]

> **Example:** MVP for a regional bank's branch network. Runs on embedded Linux hardware with a touchscreen. Must integrate with the bank's existing core banking API. Target is 500 deployed units. Built by a small internal team — simplicity and maintainability matter more than features.

## Design principles

[How decisions get made when there are tradeoffs. Agents use these to resolve ambiguity without asking.]

> **Example:**
> - Security over convenience — when in doubt, reject the transaction and explain why
> - One action per screen — never ask the customer to decide two things at once
> - Fail loudly — every error gets logged and surfaced to operations, never swallowed silently

## Features

### [Feature name]

[2-3 sentences on what this does and why it exists. Describe it in enough detail that an agent could plausibly implement it without asking a ton of clarifying questions (but they will anyway). Include edge cases and constraints if you can think of them. Use whatever format you like — user stories, stream of consciousness, rhyming couplets, whatever.]

> **Example:**
>
> ### Cash withdrawal
>
> Customer inserts card, enters PIN, and selects an amount from preset options ($20, $40, $60, $100, $200) or types a custom amount. Machine dispenses cash if the account has sufficient funds and the customer hasn't exceeded the $500/day limit. If funds are insufficient or the daily limit is reached, decline with a clear message and offer to show the balance. Always dispense in $20 bills — reject custom amounts that aren't multiples of 20.
>
> ### Balance inquiry
>
> After PIN verification, show the current balance and available balance on screen. Available balance accounts for pending transactions. Offer to print a mini-statement (last 5 transactions). No cash dispensed in this flow.
>
> ### Card retention
>
> If a customer enters the wrong PIN 3 times in a row, retain the card inside the machine and display the bank's customer service number. Log the event. Card can only be retrieved by a bank employee with a master key.

## Out of scope

[What this product deliberately does not do. Prevents agents from gold-plating or solving adjacent problems.]

> **Example:**
> - No coin dispensing
> - No loan applications or account opening
> - No foreign currency exchange
> - No person-to-person transfers
