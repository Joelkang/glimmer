import {
  CompileInto,
  SymbolLookup,
  Statement as StatementSyntax
} from '../../syntax';

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

import OpcodeBuilderDSL from '../../compiled/opcodes/builder';

import * as Syntax from '../core';
import Environment from '../../environment';

export default class WithSyntax extends StatementSyntax {
  type = "with-statement";

  public args: Syntax.Args;
  public templates: Syntax.Templates;
  public isStatic = false;

  constructor({ args, templates }: { args: Syntax.Args, templates: Syntax.Templates }) {
    super();
    this.args = args;
    this.templates = templates;
  }

  prettyPrint() {
    return `#with ${this.args.prettyPrint()}`;
  }

  compile(dsl: OpcodeBuilderDSL, env: Environment) {
    //        Enter(BEGIN, END)
    // BEGIN: Noop
    //        PutArgs
    //        Test
    //        JumpUnless(ELSE)
    //        Evaluate(default)
    //        Jump(END)
    // ELSE:  Noop
    //        Evaluate(inverse)
    // END:   Noop
    //        Exit

    let { args, templates } = this;

    dsl.block({ templates, args }, (dsl, BEGIN, END) => {
      dsl.test();

      if (templates.inverse) {
        dsl.jumpUnless('ELSE');
      } else {
        dsl.jumpUnless(END);
      }

      dsl.evaluate('default');
      dsl.jump(END);

      if (templates.inverse) {
        dsl.label('ELSE');
        dsl.evaluate('inverse');
      } else {
        dsl.evaluate('default');
        dsl.jump(END);
      }
    });
  }
}