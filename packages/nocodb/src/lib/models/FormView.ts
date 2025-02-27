import Noco from '../Noco';
import { CacheGetType, CacheScope, MetaTable } from '../utils/globals';
import { FormType } from 'nocodb-sdk';
import { deserializeJSON, serializeJSON } from '../utils/serialize';
import FormViewColumn from './FormViewColumn';
import View from './View';
import NocoCache from '../cache/NocoCache';
import { extractProps } from '../meta/helpers/extractProps';

export default class FormView implements FormType {
  show: boolean;
  is_default: boolean;
  order: number;
  title?: string;
  heading?: string;
  subheading?: string;
  success_msg?: string;
  redirect_url?: string;
  redirect_after_secs?: string;
  email?: string;
  banner_image_url?: string;
  logo_url?: string;
  submit_another_form?: boolean;
  show_blank_form?: boolean;

  fk_view_id: string;
  columns?: FormViewColumn[];

  project_id?: string;
  base_id?: string;
  meta?: string | Record<string, any>;

  constructor(data: FormView) {
    Object.assign(this, data);
  }

  public static async get(viewId: string, ncMeta = Noco.ncMeta) {
    let view =
      viewId &&
      (await NocoCache.get(
        `${CacheScope.FORM_VIEW}:${viewId}`,
        CacheGetType.TYPE_OBJECT
      ));
    if (!view) {
      view = await ncMeta.metaGet2(null, null, MetaTable.FORM_VIEW, {
        fk_view_id: viewId,
      });
      if (view) {
        view.meta = deserializeJSON(view.meta);
        await NocoCache.set(`${CacheScope.FORM_VIEW}:${viewId}`, view);
      }
    }
    return view && new FormView(view);
  }

  static async insert(view: Partial<FormView>, ncMeta = Noco.ncMeta) {
    const insertObj = extractProps(view, [
      'fk_view_id',
      'project_id',
      'base_id',
      'heading',
      'subheading',
      'success_msg',
      'redirect_url',
      'redirect_after_secs',
      'email',
      'banner_image_url',
      'logo_url',
      'submit_another_form',
      'show_blank_form',
      'meta',
    ]);
    if (insertObj.meta) {
      insertObj.meta = serializeJSON(insertObj.meta);
    }
    if (!(view.project_id && view.base_id)) {
      const viewRef = await View.get(view.fk_view_id);
      insertObj.project_id = viewRef.project_id;
      insertObj.base_id = viewRef.base_id;
    }
    await ncMeta.metaInsert2(null, null, MetaTable.FORM_VIEW, insertObj, true);

    return this.get(view.fk_view_id, ncMeta);
  }

  static async update(
    formId: string,
    body: Partial<FormView>,
    ncMeta = Noco.ncMeta
  ) {
    // get existing cache
    const key = `${CacheScope.FORM_VIEW}:${formId}`;
    let o = await NocoCache.get(key, CacheGetType.TYPE_OBJECT);
    const updateObj = extractProps(body, [
      'heading',
      'subheading',
      'success_msg',
      'redirect_url',
      'redirect_after_secs',
      'email',
      'banner_image_url',
      'logo_url',
      'submit_another_form',
      'show_blank_form',
      'meta',
    ]);

    if (o) {
      o = { ...o, ...updateObj };
      // set cache
      await NocoCache.set(key, o);
    }

    if (updateObj.meta) {
      updateObj.meta = serializeJSON(updateObj.meta);
    }

    // update meta
    return await ncMeta.metaUpdate(null, null, MetaTable.FORM_VIEW, updateObj, {
      fk_view_id: formId,
    });
  }

  async getColumns(ncMeta = Noco.ncMeta) {
    return (this.columns = await FormViewColumn.list(this.fk_view_id, ncMeta));
  }

  static async getWithInfo(formViewId: string, ncMeta = Noco.ncMeta) {
    const form = await this.get(formViewId, ncMeta);
    await form.getColumns(ncMeta);
    return form;
  }
}
