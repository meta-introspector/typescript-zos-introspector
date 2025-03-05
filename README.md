# typescript-zos-introspector

Experimental generator for simple typescript parsing and munging.

To install dependencies:

```bash
bun install
```

To run:

```
mkdir -p cloudformation/configure-additional-secrets/
bun run index.ts --path=../synapzeai-eliza-zos/app/src/types/agent-enviroment-v1.ts 
cp -r cloudformation/configure-additional-secrets/* ~/terraform/cloudformation/configure-additional-secrets/

cd ~/terraform/cloudformation/configure-additional-secrets/ClientDiscord
terraform init
terraform apply -auto-approve

```
