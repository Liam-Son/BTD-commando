# Sergeant Local Terminal

Paper-only quant advisor that runs on your computer. No server, no cloud account, no broker keys.

Download this folder from GitHub. Do not download a binary from the website.

## What it does

- Reviews a local project folder you choose.
- Explains backtest, cost, look-ahead, and risk issues in a calm sergeant voice.
- Drafts a paper-only checklist for algorithm research.
- Refuses live orders, broker credentials, and hidden trading.

## What it does not do

- It does not place trades.
- It does not connect to a broker.
- It does not guarantee a return, including any target above the S&P 500.
- It does not change your BTD score or paper book by itself.

## Run

Needs Python 3.11 or newer. No install step.

```powershell
cd path\to\sergeant-local
python sergeant_local.py --project path\to\your\quant\folder
```

Then type a question, for example:

```text
Review this backtest for look-ahead and costs.
```

Type `exit` to leave.

## Optional local model

The default mode is rule-based and works offline. A local model is optional and not included. If you later connect one, keep it on `127.0.0.1` only. Do not send strategy files or account data to a remote server.

## Security

- Review the source before you run it.
- Run it only against a folder you trust.
- Never paste broker keys, tokens, or account passwords into the prompt.
