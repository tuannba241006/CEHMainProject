<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ChuaXoaScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where($model->getTable().'.da_xoa', 0);
    }
}
