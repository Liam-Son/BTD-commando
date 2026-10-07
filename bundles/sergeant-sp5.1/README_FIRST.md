# READ ME FIRST — Sergeant SP5.1

This is the repo-ready Sergeant upgrade bundle for `Liam-Son/BTD-commando`.

Use a **clean checkout pinned to**:

`c0c0a9799770a4f33440193379c833608c351b61`

Then run:

```bash
python integration/qualify_sergeant_sp5_1.py /path/to/BTD-commando
```

Do not copy individual files into production by hand unless you know exactly what you are doing.
The qualifier preserves rollback behavior and runs the full test/build gates.

See `SP5_1_STATUS.md` for the two final fixes.
