# 00 · Start Here

This is a self-contained course, not a reference manual. It is written for someone who
wants to become a network engineer and has no idea where to start.

## What this book is

- **A curriculum**, ordered so that nothing depends on a concept you have not seen yet.
- **A field guide.** Every chapter ends with "what breaks" and "how to prove it".
- **Vendor-neutral first.** Cisco syntax appears as an example, but the ideas are the same
  on Juniper, Arista, FRR, or a Linux box.

## What this book is not

- Not a certification dump. Certifications come after understanding, not instead of it.
- Not a list of commands. Commands change; the model in your head does not.

## How to read it

Use three passes per chapter. Do not skip the third one — it is where learning happens.

| Pass | What you do | Time |
|---|---|---|
| 1. Read | Read the chapter once, without stopping to memorise | 20 min |
| 2. Draw | Close the book and draw the diagram or the flow from memory | 10 min |
| 3. Explain | Explain it out loud, as if to a friend who knows nothing | 10 min |

If step 3 is hard, you did not understand it yet. Re-read only the part that failed.

## The five questions to ask about any technology

1. **What problem does it solve?** (If you cannot answer, it is trivia.)
2. **What does it look like on the wire?** (Bytes, headers, ports.)
3. **What does it look like in the config?** (Where do I turn it on?)
4. **What does it look like when it breaks?** (Symptom -> cause.)
5. **How do I prove it works?** (Which command, which capture.)

Every chapter in this book answers all five.

## What you need

- A computer with a browser and a terminal.
- **Cisco Packet Tracer** (free with a Cisco Skills for All account) for switching labs.
- **WSL2 + containerlab + netlab** for real routing labs with FRR.
- **Wireshark**, free.
- A notebook. Physical is better. Draw topologies by hand.

## The honest timeline

| Level | What you can do | Realistic time |
|---|---|---|
| Beginner | Explain OSI, subnet a /24, build a small LAN | 4 weeks |
| Junior | Configure VLANs, OSPF, static routes, ACLs, NAT | 3 months |
| Intermediate | Design a small network, run BGP, troubleshoot with captures | 9 months |
| Employable | Own a network, automate it, explain your decisions | 12–18 months |

Anyone who promises two weeks is selling something.

## The rule that matters most

> A network engineer is not someone who memorised commands.
> It is someone who can predict what the packets will do, and prove it.

That is the whole job. Everything in this book serves that sentence.
