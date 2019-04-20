# Game Boy Opcodes

Game Boy CPU (Sharp LR35902) instruction set (opcodes)

The [opcodes.json](https://raw.githubusercontent.com/lmmendes/game-boy-opcodes/master/opcodes.json) contains a JSON representation of the complete Sharp LR35902 instruction set. Inside the `bin` folder you will find the script used to generate the `opcodes.json` file from the pastraiser.com site.

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
      "operand1": "0",        <-- Operand 1
      "operand2": "B"         <-- Operand 2
    },
    ...
  },
  ...
}
```

## Reference documentation

http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/lmmendes/game-boy-opcodes. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

## License

The code is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
