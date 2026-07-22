import { AiToolManifest } from "../manifest/ai-tool-manifest";
import { AiJsonValue, AiToolExecutionContext } from "../types/ai-tool.types";

export interface AiToolPort {
  readonly manifest: AiToolManifest;

  execute(
    input: AiJsonValue,
    context: AiToolExecutionContext,
  ): Promise<AiJsonValue>;
}
