import { JSONSchema6 } from 'json-schema'
import { getProgramFromFiles, generateSchema, Program } from 'typescript-json-schema'
import { sync as globSync } from 'glob'
import * as path from 'path'

interface JsonParserFile {
    extension: string
    url: string
}

export interface Options {
    tsconfigPath?: string
    sourceFilesDir?: string
    order?: number
    extensions?: string[]
}

export default class JsonSchemaTypescriptResolver {
    public order: number
    protected program: Program
    protected tsconfigPath: string
    protected sourceFilesDir: string
    protected cache = {}
    protected extensions: string[]

    public canRead = (file: JsonParserFile) => {
        return this.extensions.map(ext => `.${ext}`).includes(file.extension)
    }

    public read = (file: JsonParserFile): JSONSchema6 => {
        return this.getFileDefinitions(this.resolveAlias(file.url))
    }

    public constructor({
        tsconfigPath = 'tsconfig.json',
        sourceFilesDir = 'src',
        order = 1,
        extensions = ['ts', 'd.ts']
    }: Options = {}) {
        this.order = order
        this.tsconfigPath = path.resolve(process.cwd(), tsconfigPath)
        this.sourceFilesDir = path.resolve(process.cwd(), sourceFilesDir)
        this.extensions = extensions
    }

    public preload() {
        this.getProgram()
    }

    // Should be Typescript native but I don't find how ... small shitty code to fix it (for me ahah)
    protected resolveAlias(file: string) {
        const paths = this.getProgram().getCompilerOptions().paths || {}
        const pathsAlias = Object.keys(paths).filter(key => key.includes('/*'))

        return pathsAlias.reduce((file, alias) => {
            const resolve = paths[alias][0]
            return file.replace(alias.replace('*', ''), resolve.replace('*', ''))
        }, file)
    }

    protected getFileDefinitions(file: string): JSONSchema6 {
        if (!this.cache[file]) {
            this.cache[file] = this.generateFileDefinitions(file)
        }

        return this.cache[file]
    }

    protected generateFileDefinitions(file: string): JSONSchema6 {
        return generateSchema(
            this.getProgram(),
            '*',
            {required: true},
            [file]
        ) as JSONSchema6
    }

    protected getProgram(): Program {
        if (!this.program) {
            const globExtensions = this.extensions.join('|')

            this.program = getProgramFromFiles(
                globSync(this.sourceFilesDir + `/**/*.+(${globExtensions})`),
                require(this.tsconfigPath).compilerOptions
            )
        }

        return this.program
    }

}
