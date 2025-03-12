import { encode } from "gpt-tokenizer";

interface ResponseTemplate {
  name: string;
  template: string;
  useCase: string;
  maxTokens: number;
}

interface OptimizationConfig {
  maxTokens: number;
  targetLength: "concise" | "balanced" | "detailed";
  includeSourceCitations: boolean;
  formatType: "markdown" | "plain";
  useCase?: string;
}

interface OptimizationMetrics {
  inputTokens: number;
  outputTokens: number;
  compressionRatio: number;
  citationCount: number;
  averageChunkScore: number;
}

export class ResponseOptimizer {
  private templates: Map<string, ResponseTemplate>;
  private defaultConfig: OptimizationConfig;

  constructor() {
    this.templates = new Map();
    this.defaultConfig = {
      maxTokens: 1000,
      targetLength: "balanced",
      includeSourceCitations: true,
      formatType: "markdown",
    };

    // Initialize default templates
    this.initializeTemplates();
  }

  private initializeTemplates() {
    const defaultTemplates: ResponseTemplate[] = [
      {
        name: "concise_answer",
        template:
          "Here's a brief answer:\n\n{content}\n\nKey sources: {citations}",
        useCase: "general",
        maxTokens: 300,
      },
      {
        name: "detailed_explanation",
        template:
          "Here's a detailed explanation:\n\n{content}\n\nSources:\n{citations}",
        useCase: "technical",
        maxTokens: 1000,
      },
      {
        name: "step_by_step",
        template:
          "Follow these steps:\n\n{content}\n\nReferences:\n{citations}",
        useCase: "tutorial",
        maxTokens: 800,
      },
    ];

    defaultTemplates.forEach((template) => {
      this.templates.set(template.name, template);
    });
  }

  public async optimizeResponse(
    content: string,
    context: { chunks: any[]; scores: number[] },
    config: Partial<OptimizationConfig> = {}
  ): Promise<{ response: string; metrics: OptimizationMetrics }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const metrics = this.calculateMetrics(content, context);

    // Select appropriate template
    const template = this.selectTemplate(finalConfig);

    // Optimize content length
    let optimizedContent = await this.optimizeLength(
      content,
      finalConfig.maxTokens
    );

    // Format citations if needed
    if (finalConfig.includeSourceCitations) {
      optimizedContent = await this.addCitations(optimizedContent, context);
    }

    // Apply template
    const response = template.template
      .replace("{content}", optimizedContent)
      .replace("{citations}", this.formatCitations(context));

    return { response, metrics };
  }

  private selectTemplate(config: OptimizationConfig): ResponseTemplate {
    const useCase = config.useCase || "general";
    const targetLength = config.targetLength;

    // Find the most appropriate template based on use case and target length
    for (const template of this.templates.values()) {
      if (
        template.useCase === useCase &&
        ((targetLength === "concise" && template.maxTokens <= 300) ||
          (targetLength === "balanced" && template.maxTokens <= 800) ||
          (targetLength === "detailed" && template.maxTokens <= 1500))
      ) {
        return template;
      }
    }

    // Fallback to first matching use case or default template
    return (
      Array.from(this.templates.values()).find((t) => t.useCase === useCase) ||
      this.templates.get("concise_answer")!
    );
  }

  private async optimizeLength(
    content: string,
    maxTokens: number
  ): Promise<string> {
    const tokens = encode(content);
    if (tokens.length <= maxTokens) return content;

    // Implement smart truncation while preserving meaning
    const sentenceEndings = /[.!?]\s+/g;
    const sentences = content.split(sentenceEndings);
    let result = "";
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = encode(sentence).length;
      if (currentTokens + sentenceTokens > maxTokens * 0.9) break;
      result += sentence + ". ";
      currentTokens += sentenceTokens;
    }

    return result.trim();
  }

  private async addCitations(
    content: string,
    context: { chunks: any[] }
  ): Promise<string> {
    // Add inline citations to the content
    let citedContent = content;
    context.chunks.forEach((chunk, index) => {
      if (chunk.metadata?.source) {
        citedContent = citedContent.replace(
          new RegExp(chunk.content.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          `${chunk.content} [${index + 1}]`
        );
      }
    });
    return citedContent;
  }

  private formatCitations(context: { chunks: any[] }): string {
    return context.chunks
      .map((chunk, index) => {
        if (!chunk.metadata?.source) return "";
        return `[${index + 1}] ${chunk.metadata.source}${
          chunk.metadata.page ? `, p.${chunk.metadata.page}` : ""
        }`;
      })
      .filter(Boolean)
      .join("\n");
  }

  private calculateMetrics(
    content: string,
    context: { chunks: any[]; scores: number[] }
  ): OptimizationMetrics {
    const inputTokens = encode(content).length;
    const outputTokens = context.chunks.reduce(
      (sum, chunk) => sum + encode(chunk.content).length,
      0
    );
    const citationCount = context.chunks.filter(
      (chunk) => chunk.metadata?.source
    ).length;
    const averageChunkScore =
      context.scores.reduce((sum, score) => sum + score, 0) /
      context.scores.length;

    return {
      inputTokens,
      outputTokens,
      compressionRatio: outputTokens > 0 ? inputTokens / outputTokens : 1,
      citationCount,
      averageChunkScore,
    };
  }

  public addTemplate(template: ResponseTemplate) {
    this.templates.set(template.name, template);
  }

  public getTemplates(): ResponseTemplate[] {
    return Array.from(this.templates.values());
  }
}
