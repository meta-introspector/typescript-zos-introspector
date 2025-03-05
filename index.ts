import * as fs from 'fs';
import * as Types from '@sinclair/typebox'
import type { TypeBoxModel } from '@sinclair/typebox-codegen';
import { TypescriptParser } from 'typescript-parser';

const parser = new TypescriptParser();
import * as Codegen from '@sinclair/typebox-codegen'
var argv = require( 'argv' );
var args = argv.option({name: 'path',short: 'p',type: 'list,path,string'}).run();
const target = args['options']["path"]
const parsed = await parser.parseFile(target, 'workspace root');

export class CloudFormationResult{
  "parameters":string
  "conditionals":string
  "resources":string
}

function ToCamelCase(str: string) {
    return str.toLowerCase()
	.split('_')
	.map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
	.join('')
}
function ToCamelCase2(str: string) {
  return str.toLowerCase()
    .split('_')
    .map((word, index) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

export namespace ModelToCdkParameters {
    function GetParameterConfig(schema: Types.TSchema, name: string) {
	const config: Record<string, any> = {
	    description: `Parameter for ${name}`
	}
        if (Types.TypeGuard.IsString(schema)) {
	    config.type = 'String'
	    if (schema.default) config.default = schema.default
	}
	else if (Types.TypeGuard.IsBoolean(schema)) {
	    config.type = 'String'
	    config.allowedValues = ['true', 'false']
	    config.default = schema.default !== undefined ? String(schema.default) : 'false'
	}
	else if (Types.TypeGuard.IsNumber(schema) || Types.TypeGuard.IsInteger(schema)) {
	    config.type = 'Number'
	    if (schema.default) config.default = schema.default
	    if (schema.enum) config.allowedValues = schema.enum
	}
	else {
	    config.type = 'String' // Fallback for unsupported types
	}	
	return config
    }

  function Object(schema: Types.TObject): CloudFormationResult[] {
      const parameters: string[] = []

      const props = schema["properties"];
      //console.log("PROPS1",props)
      const properties = globalThis.Object.keys(schema.properties);
      let result :CloudFormationResult[] = [];
      properties.forEach((key) => {
              //console.log("DEBUG2", acc, "KEY", key);
              const paramName = ToCamelCase(key);
              const property = schema.properties[key]
              const config = GetParameterConfig(property, key);	  
             
              const hasParamName = ToCamelCase2("Has__"+key);
              const Objhas = ObjectHas( hasParamName, paramName)            
              const ObjSSM = ObjectSSM( hasParamName, paramName, key,config.description)             
              let cfnYamlDefault = ""
              if (config.default) {
                  cfnYamlDefault = `Default: '${config.default}'`;
              }
              const cfnYaml =  `
  ${paramName}:
    Type: '${config.type}'
    Description: '${config.description}'
    ${cfnYamlDefault}`
    

              result.push( {
                // componse this dynamically
                 "parameters" : cfnYaml,
                  "conditionals": Objhas,
                  "resources" : ObjSSM,
              })
            });      
      return result
  }


  function ObjectSSM(hasParamName: string, paramName: string,  key:string, description:string): string {
      const paramName2 = ToCamelCase2("Agent_Param_"+key);
      
    return  `
  ${paramName2}Parameter:
    Type: 'AWS::SSM::Parameter'
    Condition: ${hasParamName}
    Properties:
      Name: !Sub '\${AgentCodeName}_${key}'
      Type: 'String'
      Value: !Ref ${paramName}
      Tier: 'Standard'
      Description: '${description}'`;

  }

  function ObjectHas(hasParamName: string, paramName: string): string {
    return  `  ${hasParamName}: !Not [!Equals [!Ref ${paramName}, ""]]`
  }

  // Main visitation function
  function Visit(schema: Types.TSchema): CloudFormationResult[] {
    if (Types.TypeGuard.IsObject(schema)) 
      return Object(schema)
    return [] // Only handling objects for now, can be extended for other types
  }

  export function Generate(model: TypeBoxModel): string {
    const buffer: string[] = [ ]
      let parameters : string[] =[]
      let conditionals :string[] =[]
      let resources : string[] =[]

      for (const type of model.types.filter((type) => Types.TypeGuard.IsObject(type) && type.$id)) {
        //console.log("ISTHISUSED",type.$id);
        const id = type?.$id ?? 'defaultId';
	      const className = `${id.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`   
	      const objs = Visit(type)
	      //buffer.push(...parameters.map(p => p.split('\n').map(line => `    ${line}`).join('\n')))
        objs.forEach((obj) => {
          parameters.push (obj.parameters)
          conditionals.push(obj.conditionals) 
          resources.push(obj.resources) 
        });
        const yamlContent = `
AWSTemplateFormatVersion: "2010-09-09"
Metadata:
    Generator: "https://github.com/meta-introspector/typescript-zos-introspector"
Description: "parameters extracted from https://github.com/sekmet/synapzeai"
Parameters:
${parameters.join("")}
Conditions:
${conditionals.join("")}
Resources:
${resources.join("")}
`;


	  const folderName =   `cloudformation/configure-additional-secrets/${className}`;
	  try {
	      if (!fs.existsSync(folderName)) {
		  fs.mkdirSync(folderName);
	      }
	  } catch (err) {
	      console.error(err);
	  }
	  const filename = `${folderName}/cloudformation-${className}.yml`;
	  
          fs.writeFileSync(filename, yamlContent);
	  //console.log(`Generated ${className}.yaml`); 

	  const tffile = `${folderName}/main.tf`;
 	  const contents = `
 variable patch { default = "v1" }
 module "deploy_${className}" {
 source  = "../runbook"
 runbook = "${className}"
 patch   = var.patch
 }
`
	  
	  fs.writeFileSync(tffile,contents);
          console.log(`module "deploy_${className}`)
        
        
      }
    return buffer.join('\n')    
}
}

function dosomething(declaration:any): void {
  if (declaration.name) {
    declaration["properties"]?.forEach(prop => {
      const code = `export type ${prop.name} ${prop.type}`;
      const model = Codegen.TypeScriptToModel.Generate(code);
      const code2 = ModelToCdkParameters.Generate(model);

    });
  }
}

parsed.declarations.forEach(dosomething)
