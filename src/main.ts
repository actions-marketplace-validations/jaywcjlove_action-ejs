import fs from 'fs';
import path from 'path';
import { setFailed, setOutput, getInput, info, startGroup, endGroup } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { render, renderFile, Options } from 'ejs';
import * as yaml from 'yaml';


try {
  ;(async () => {
    const token = getInput('token');
    const template = getInput('template');
    const templateFile = getInput('template-file');
    const vars = getInput('vars');
    const varsFile = getInput('vars-file');
    const options = getInput('options');
    const output = path.resolve(process.cwd(), getInput('output'));

    startGroup(`Github Context:`);
    info(`${JSON.stringify(context, undefined, 2)}`);
    endGroup();
    startGroup(`Github process.env Object:`);
    info(`${JSON.stringify(process.env, undefined, 2)}`);
    endGroup();
    startGroup(`Input vars-file:`);
    info(`${JSON.stringify(varsFile, undefined, 2)}`);
    info(`${JSON.stringify(yaml.parse(varsFile), undefined, 2)}`);
    endGroup();

    let ejsData: Record<string, any> = { context, env: process.env };
    let ejsOptions: Options = {}

    if (varsFile && Array.isArray(varsFile)) {
      varsFile.forEach(item => {
        Object.keys(item).forEach((key) => {
          const fPaht = path.resolve(process.cwd(), item[key]);
          let content = '';
          if (fs.existsSync(fPaht)) {
            content = fs.readFileSync(fPaht).toString();
          }
          ejsData[key] = content;
        });
      });
    }

    try {
      ejsData = { ...JSON.parse(vars), ...ejsData };
    } catch (error) {
      setFailed(`Input "vars" Error: ${error.message}`);
    }

    try {
      ejsOptions = JSON.parse(options);
    } catch (error) {
      setFailed(`Input "options" Error: ${error.message}`);
    }
    
    let html = '';

    const templateFilePath = path.resolve(process.cwd(), templateFile);
    if (templateFile && fs.existsSync(templateFilePath)) {
      html = await renderFile(templateFilePath, ejsData, ejsOptions);
    } else {
      html = await render(template, ejsData, ejsOptions);
    }

    startGroup(`Output content:`);
    info(`${html}`);
    endGroup();

    setOutput('content', html);
    info(`${output}`);

    await fs.promises.writeFile(output, html);
  })();
} catch (error) {
  setFailed(error.message);
}