
console.log("Hello via Bun!");
import { TypescriptParser } from 'typescript-parser';
const parser = new TypescriptParser();
import * as Codegen from '@sinclair/typebox-codegen'

var argv = require( 'argv' );

var args = argv.option( 
    {		name: 'path',		short: 'p',
					type: 'list,path,string'
			}
).run();
 
// or a filepath
//console.log("ARGS",args)
const target = args['options']["path"]
//console.log("TARGET",target)
const parsed = await parser.parseFile(target, 'workspace root');
//console.log("TARGET",parsed)

// for each type 
// {
//   filePath: "../synapzeai-eliza-zos/app/src/types/agent-enviroment-v1.ts",
//   rootPath: "workspace root",
//   start: 0,
//   end: 40071,
//   imports: [],
//   exports: [],
//   declarations: [
//     InterfaceDeclaration {
//       name: "AgentEnvironmentVars",
//       isExported: true,
//       start: 0,
//       end: 40071,
//       accessors: [],
//       properties: [
//         PropertyDeclaration {
//           name: "server",
//           visibility: 2,
//           type: "{\n      // Cache Configs\n      CACHE_STORE?: string;           // Defaults to 'database'. Other options: 'redis', 'filesystem'\n      CACHE_DIR?: string;             // Directory to store cache files if using filesystem cache\n      REDIS_URL?: string;             // Redis URL, supports rediss:// URLs\n      SERVER_URL?: string;            // Server URL, e.g., 'http://localhost'\n      SERVER_PORT?: number;           // Server port number, e.g., 3000\n\n      REMOTE_CHARACTER_URLS?: string; // Comma-separated list of remote character URLs\n      USE_CHARACTER_STORAGE?: boolean; // Whether to store characters in data/character folder\n\n      DEFAULT_LOG_LEVEL?: string;     // Logging level, e.g., 'info'\n      LOG_JSON_FORMAT?: boolean;      // Whether to print logs in JSON format\n      EXPRESS_MAX_PAYLOAD?: string;   // Max payload size for Express, e.g., '100kb'\n      TRANSCRIPTION_PROVIDER?: string; // Transcription provider, e.g., 'local', 'openai', 'deepgram'\n\n      //# Fallback Wallet Configuration (deprecated)\n      WALLET_PRIVATE_KEY?: string;    // Fallback wallet private key\n      WALLET_PUBLIC_KEY?: string;     // Fallback wallet public key\n\n      // # Tokenizer Settings\n      tokenizer: {\n        TOKENIZER_MODEL?: string;       // Tokenizer model\n        TOKENIZER_TYPE?: string;        // Type, e.g., 'tiktoken', 'auto'\n      };\n\n      // Cloudflare AI Configuration\n      cloudflare: {\n        CLOUDFLARE_GW_ENABLED?: boolean; // Enable Cloudflare gateway\n        CLOUDFLARE_AI_ACCOUNT_ID?: string; // Account ID\n        CLOUDFLARE_AI_GATEWAY_ID?: string; // Gateway ID\n      }\n\n      // # AWS Credentials for S3 File Upload and Amazon Bedrock\n      aws: {\n        AWS_ACCESS_KEY_ID?: string;     // AWS access key ID\n        AWS_SECRET_ACCESS_KEY?: string; // AWS secret access key\n        AWS_REGION?: string;            // AWS region\n        AWS_S3_BUCKET?: string;         // S3 bucket\n        AWS_S3_UPLOAD_PATH?: string;    // S3 upload path\n        AWS_S3_ENDPOINT?: string;       // S3 endpoint\n        AWS_S3_SSL_ENABLED?: boolean;   // SSL enabled\n        AWS_S3_FORCE_PATH_STYLE?: boolean; // Force path style\n      };      \n\n\n      // # Verifiable Inference Configuration\n      verifiable_inference: {\n        VERIFIABLE_INFERENCE_ENABLED?: boolean; // Enable verifiable inference\n        VERIFIABLE_INFERENCE_PROVIDER?: string; // Provider, e.g., 'opacity'\n      };\n\n    }",
//           isOptional: false,
//           isStatic: false,
//           start: 182,
//           end: 2600,

// call this 
//const Code = Codegen.TypeScriptToTypeBox.Generate(`
//  type T = { x: number, y: number, z: number }
//`)

/*--------------------------------------------------------------------------

@sinclair/typebox-codegen

The MIT License (MIT)

[... existing license text ...]

---------------------------------------------------------------------------*/

//import { Formatter } from '../common/index'
//import { TypeBoxModel } from './model'
import * as Types from '@sinclair/typebox'
import type { TypeBoxModel } from '@sinclair/typebox-codegen';


export namespace ModelToSSMParameters {
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

  // Convert property name to camelCase
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
  // Process object properties
  function Object(schema: Types.TObject): string[] {
      const parameters: string[] = []

      const props = schema["properties"];
      //console.log("PROPS1",props)
      const properties = globalThis.Object.keys(schema.properties).reduce((acc, key) => {
          //console.log("DEBUG2", acc, "KEY", key);
          const paramName = ToCamelCase(key);
	  const paramName2 = ToCamelCase2("Agent_Param_"+key);
	  
	  const property = schema.properties[key]
          const config = GetParameterConfig(property, key);
	  
	  let cfnYamlDefault = ""
	  if (config.default) {
	      cfnYamlDefault = `  Default: '${config.default}'`;
	  }
	  const cfnYaml =  `
  ${paramName2}Parameter:
    Type: 'AWS::SSM::Parameter'
    Properties:
      Name: !Sub '\${AgentCodeName}_${key}'
      Type: 'String'
      Value: !Ref ${paramName}
      Tier: 'Standard'
      Description: '${config.description}'`;
	  console.log(cfnYaml)	  ;
      });

      
      return parameters
  }

  // Main visitation function
  function Visit(schema: Types.TSchema): string[] {
    if (Types.TypeGuard.IsObject(schema)) return Object(schema)
    return [] // Only handling objects for now, can be extended for other types
  }

  export function Generate(model: TypeBoxModel): string {
    const buffer: string[] = [    ]

    for (const type of model.types.filter((type) => Types.TypeGuard.IsObject(type) && type.$id)) {
      const className = `${type.$id.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Stack`
     
      const parameters = Visit(type)
      buffer.push(...parameters.map(p => p.split('\n').map(line => `    ${line}`).join('\n')))
      
    }
      return buffer.join('\n')
      
  }
}


// Iterate over each type declaration and generate TypeBox code
parsed.declarations.forEach(declaration => {

    //console.log("DECLARATION")
    if (declaration.name) {

	//console.log("DECLARATION",declaration['properties'])
	
	declaration["properties"]?.forEach(prop => {
	    //console.log(`DEBUG1  ${declaration.name} ${prop.name}`);
	    //console.log(`DEBUG type ${prop.type}`);
            //const typeBoxCode = Codegen.TypeScriptToTypeBox.Generate(
	    const code = `export type ${prop.name} ${prop.type}`;

//	    console.log(`DEBUG code ${code}`);
	    const model = Codegen.TypeScriptToModel.Generate(code)

//o	    console.log('TypeScript To Inline Model', model)

	    
	    //const code2 = ModelToCdkParameters.Generate(model)
	    const ssm = ModelToSSMParameters.Generate(model)
	    
	    //oconsole.log('Model To CDK', code2);
	    // console.log('Model To JsonSchema Inline', Codegen.ModelToJsonSchema.Generate(model))
	    // console.log('Model To JavaScript', Codegen.ModelToJavaScript.Generate(model))
	    // console.log('Model To TypeScript', Codegen.ModelToTypeScript.Generate(model))
	    // console.log('Model To Valibot', Codegen.ModelToValibot.Generate(model))
	    // console.log('Model To Value', Codegen.ModelToValue.Generate(model))
	    // console.log('Model To Yup', Codegen.ModelToYup.Generate(model))
	    // console.log('Model To Zod', Codegen.ModelToZod.Generate(model))
	    // console.log('Model To ArkType', Codegen.ModelToArkType.Generate(model))
	    // console.log('Model To Effect', Codegen.ModelToEffect.Generate(model))
	    //console.log("CODE",typeBoxCode);
            
	})
    }
});
