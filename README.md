# Game Boy Opcodes

Game Boy CPU (Sharp LR35902) instruction set (opcodes)

The [opcodes.json](https://raw.githubusercontent.com/lmmendes/game-boy-opcodes/master/opcodes.json) contains a JSON representation of the complete Sharp LR35902 instruction set. Inside the `bin` folder you will find the script used to generate the `opcodes.json` file from the pastraiser.com site.

## Description of opcodes.json

> The opcodes.json file includes some minor fixes in the opcode length and timings not present on the pastraiser.com site.

```
{
  "unprefixed": {
    "0xc0": {                 <-- Address
      "mnemonic": "SET",      <-- Instruction mnemonic
      "length": 2,            <-- Length in bytes
      "cycles": [             <-- Duration in cycles
        8
      ],
      "flags": [              <-- Flags affected
        "-",                  <-- Z - Zero Flag
        "-",                  <-- N - Subtract Flag
        "-",                  <-- H - Half Carry Flag
        "-"                   <-- C - Carry Flag
      ],
      "addr": "0xc0",         <-- Address
      "group": "control/misc" <-- Opcode group
      "operand1": "0",        <-- Operand 1
      "operand2": "B"         <-- Operand 2
    },
    ...
  },
  ...
}
```


Instruction **STOP** has according to manuals opcode **10 00** and thus is 2 bytes long. Anyhow it seems there is no reason for it so some assemblers code it simply as one byte instruction **10**.
Flags affected are always shown in **Z H N C** order. If flag is marked by "**0**" it means it is reset after the instruction. If it is marked by "**1**" it is set. If it is marked by "-" it is not changed. If it is marked by "**Z**", "**N**", "**H**" or "**C**" corresponding flag is affected as expected by its function.

**d8**  means immediate 8 bit data
**d16** means immediate 16 bit data
**a8**  means 8 bit unsigned data, which are added to $FF00 in certain instructions (replacement for missing **IN** and **OUT** instructions)
**a16** means 16 bit address
**r8**  means 8 bit signed data, which are added to program counter

**LD A,(C)** has alternative mnemonic **LD A,($FF00+C)**
**LD C,(A)** has alternative mnemonic **LD ($FF00+C),A**
**LDH A,(a8)** has alternative mnemonic **LD A,($FF00+a8)**
**LDH (a8),A** has alternative mnemonic **LD ($FF00+a8),A**
**LD A,(HL+)** has alternative mnemonic **LD A,(HLI)** or **LDI A,(HL)**
**LD (HL+),A** has alternative mnemonic **LD (HLI),A** or **LDI (HL),A**
**LD A,(HL-)** has alternative mnemonic **LD A,(HLD)** or **LDD A,(HL)**
**LD (HL-),A** has alternative mnemonic **LD (HLD),A** or **LDD (HL),A**
**LD HL,SP+r8** has alternative mnemonic **LDHL SP,r8**

|group            |description|
|-----------------|-----------------------------|
|x8/lsm           |8-bit Load/Store/Move|
|x16/lsm          |16-bit Load/Store/Move|
|x8/alu           |8-bit Arithmetic Logic Unit|
|x16/alu          |16-bit Arithmetic Logic Unit|
|x8/rsb           |8-bit ???|
|control/br       |branch|
|control/misc     |misc|



## Reference documentation

http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/lmmendes/game-boy-opcodes. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

## License

The code is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
