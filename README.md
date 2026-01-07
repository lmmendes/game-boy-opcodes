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

Operation group table:

|op group         |description|
|-----------------|-----------------------------|
|x8/lsm           |8-bit Load/Store/Move|
|x16/lsm          |16-bit Load/Store/Move|
|x8/alu           |8-bit Arithmetic Logic Unit|
|x16/alu          |16-bit Arithmetic Logic Unit|
|x8/rsb           |8-bit ???|
|control/br       |branch|
|control/misc     |misc|



## Reference documentation

https://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/lmmendes/game-boy-opcodes. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](https://contributor-covenant.org) code of conduct.

## License

The code is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
