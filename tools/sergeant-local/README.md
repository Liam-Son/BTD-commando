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

## Turn Sergeant on from the website

On [the desk](https://btd.noviark.net/sergeant), use the **On / Off** switch. That choice stays on this computer only.

Off uses Corporal in the page. On talks to a terminal you start yourself:

```powershell
cd path\to\sergeant-local
python sergeant_local.py --serve --project path\to\a\real\folder
```

Leave that window open. The badge should say `Sergeant on · this computer`. Close the window, or press Ctrl+C, to turn it off. It listens only on `127.0.0.1:8765`. Nothing is sent to a remote model.

## Optional local model

The default mode is rule-based and works offline. A local model is optional and not included. If you later connect one, keep it on `127.0.0.1` only. Do not send strategy files or account data to a remote server.

## Security

- Review the source before you run it.
- Run it only against a folder you trust.
- Never paste broker keys, tokens, or account passwords into the prompt.
