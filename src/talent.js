import { clone, weightRandom } from './functions/util.js';
import { checkCondition, extractMaxTriggers } from './functions/condition.js';
import { getRate } from './functions/addition.js';

class Talent {
    constructor() {}

    #talents;

    initial({talents}) {
        this.#talents = talents;
        for(const id in talents) {
            const talent = talents[id];
            talent.id= Number(id);
            talent.grade = Number(talent.grade);
            talent.max_triggers = extractMaxTriggers(talent.condition);
            if(talent.replacement) {
                for(let key in talent.replacement) {
                    const obj = {};
                    for(let value of talent.replacement[key]) {
                        value = `${value}`.split('*');
                        obj[value[0]||0] = Number(value[1]) || 1;
                    }
                    talent.replacement[key] = obj;
                }
            }
        }
    }

    count() {
        return Object.keys(this.#talents).length;
    }

    check(talentId, property) {
        const { condition } = this.get(talentId);
        return checkCondition(property, condition);
    }

    get(talentId) {
        const talent = this.#talents[talentId];
        if(!talent) throw new Error(`[ERROR] No Talent[${talentId}]`);
        return clone(talent);
    }

    information(talentId) {
        const { grade, name, description } = this.get(talentId)
        return { grade, name, description };
    }

    exclusive(talends, exclusiveId) {
        const { exclusive } = this.get(exclusiveId);
        if(!exclusive) return null;
        for(const talent of talends) {
            for(const e of exclusive) {
                if(talent == e) return talent;
            }
        }
        return null;
    }

    talentRandom(include, {times = 0, achievement = 0} = {}) {
        let talentList = [];
        for (const talentId in this.#talents) {
            const {id, grade, name, description} = this.#talents[talentId];
            if (!talentList) talentList = [{grade, name, description, id}];
            else talentList.push({grade, name, description, id});
        }

        talentList.sort(function (a, b) {
            return b.grade - a.grade;
        });

        return talentList;
    }

    allocationAddition(talents) {
        if(Array.isArray(talents)) {
            let addition = 0;
            for(const talent of talents)
                addition += this.allocationAddition(talent);
            return addition;
        }
        return Number(this.get(talents).status) || 0;
    }

    do(talentId, property) {
        const { effect, condition, grade, name, description } = this.get(talentId);
        if(condition && !checkCondition(property, condition))
            return null;
        return { effect, grade, name, description };
    }

    replace(talents) {
        const getReplaceList = (talent, talents) => {
            const { replacement } = this.get(talent);
            if(!replacement) return null;
            const list = [];
            if(replacement.grade) {
                this.forEach(({id, grade})=>{
                    if(!replacement.grade[grade]) return;
                    if(this.exclusive(talents, id)) return;
                    list.push([id, replacement.grade[grade]]);
                })
            }
            if(replacement.talent) {
                for(let id in replacement.talent) {
                    id = Number(id);
                    if(this.exclusive(talents, id)) continue;
                    list.push([id, replacement.talent[id]]);
                }
            }
            return list;
        }

        const replace = (talent, talents) => {
            const replaceList = getReplaceList(talent, talents);
            if(!replaceList) return talent;
            const rand = weightRandom(replaceList);
            return replace(
                rand, talents.concat(rand)
            );
        }

        const newTalents = clone(talents);
        const result = {};
        for(const talent of talents) {
            const replaceId = replace(talent, newTalents);
            if(replaceId != talent) {
                result[talent] = replaceId;
                newTalents.push(replaceId);
            }
        }
        return result;
    }

    forEach(callback) {
        if(typeof callback != 'function') return;
        for(const id in this.#talents)
            callback(clone(this.#talents[id]), id);
    }

}

export default Talent;