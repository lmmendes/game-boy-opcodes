#!/usr/bin/env ruby
# encoding: utf-8

require 'bundler'
Bundler.require(:default)

require 'open-uri'
require 'json'

if !File.exists? 'opcodes.html'
  html = open 'http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html'
  File.open('opcodes.html', 'w') do |f|
    f.write html.read.force_encoding('UTF-8')
  end
end

def table_extractor(table)
  opcodes = {}
  op_index = 0
  table.css('tr').each_with_index do |tr, tr_index|
    next if tr_index == 0
    tr.css('td').each_with_index do |td, td_index|
      next if td_index == 0
      next if td.text  == '&nbsp;'
      opcode, operators = td.children[0].text.split(' ')
      if [1].include? opcode.size
        op_index+=1
        next
      end
      operator1, operator2 = operators.to_s.split(',')
      length, cycles = td.children[2].text.split(/[[:space:]]+/)
      flags = td.children[4].text.split(/[[:space:]]+/)
      addr  = "0x#{op_index.to_s(16)}"
      opcodes[ addr ] = {
        "mnemonic" => opcode,
        "length"   => length.to_i,
        "cycles"   => cycles.split('/').collect(&:to_i),
        "flags"    => flags,
        "addr"     => addr
      }
      opcodes[ addr ]["operator1"] = operator1.to_s if operator1
      opcodes[ addr ]["operator2"] = operator2.to_s if operator2
      op_index+=1
    end
  end
  opcodes
end

puts File.open('opcodes.html', encoding: 'UTF-8').read
html = Oga.parse_html File.open('opcodes.html').read
tables = html.css('table')
opcodes = {
  'unprefixed' => table_extractor(tables[0]),
  'cbprefixed' => table_extractor(tables[1])
}

File.open('opcodes.json', 'w').write JSON.pretty_generate(opcodes)
