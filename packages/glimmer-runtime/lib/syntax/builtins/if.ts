import {
  CompileInto,
  SymbolLookup,
  Statement as StatementSyntax
} from '../../syntax';

import * as Syntax from '../core';

import {
  LabelOpcode,
  EnterOpcode,
  PutArgsOpcode,
  TestOpcode,
  JumpUnlessOpcode,
  JumpOpcode,
  EvaluateOpcode,
  ExitOpcode
} from '../../compiled/opcodes/vm';

import OpcodeBuilderDSL from '../../compiled/opcodes/builder'

import Environment from '../../environment';

export default class IfSyntax extends StatementSyntax {
  type = "if-statement";

  public args: Syntax.Args;
  public templates: Syntax.Templates;
  public isStatic = false;

  constructor({ args, templates }: { args: Syntax.Args, templates: Syntax.Templates }) {
    super();
    this.args = args;
    this.templates = templates;
  }

  prettyPrint() {
    return `#if ${this.args.prettyPrint()}`;
  }

  compile(dsl: OpcodeBuilderDSL) {
    //        Enter(BEGIN, END)
    // BEGIN: Noop
    //        PutArgs
    //        Test
    //        JumpUnless(ELSE)
    //        Evaluate(default)
    //        Jump(END)
    // ELSE:  Noop
    //        Evalulate(inverse)
    // END:   Noop
    //        Exit

    let { args, templates } = this;

    dsl.unit({ templates }, dsl => {
      dsl.enter('BEGIN', 'END');
      dsl.label('BEGIN');
      dsl.putArgs(args);
      dsl.test();

      if (templates.inverse) {
        dsl.jumpUnless('ELSE');
        dsl.evaluate('default');
        dsl.jump('END');
        dsl.label('ELSE');
        dsl.evaluate('inverse')
      } else {
        dsl.jumpUnless('END');
        dsl.evaluate('default');
      }

      dsl.label('END');
      dsl.exit();
    });



  }
}